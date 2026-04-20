import SwiftUI
import AppKit

/// 工具窗口宿主： accessory 应用里普通 `NSPanel` 容易在切前台时自动隐藏或不成第一响应者，导致点击后卡住、光标移出才恢复。
private final class ToolHostPanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}

/// 应用代理 - 管理后台任务和数据库初始化
class AppDelegate: NSObject, NSApplicationDelegate {
    // MARK: - Properties

    /// 每种工具类型一个面板，避免重复创建
    private var toolWindows: [ToolType: NSPanel] = [:]

    // MARK: - Lifecycle

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)

        Task {
            await initializeDatabase()
        }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleOpenToolWithInput(_:)),
            name: Constants.Notification.openToolWithInput,
            object: nil
        )
    }

    private func initializeDatabase() async {
        do {
            let _ = try await DatabaseService.shared.getDBQueue()
            Logger.info("Database ready")
        } catch {
            Logger.error("Database initialization failed: \(error)")
        }
    }
    
    // MARK: - Notifications
    
    /// 从快捷搜索打开工具（带预填输入）
    @objc private func handleOpenToolWithInput(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let tool = userInfo["tool"] as? ToolItem,
              let input = userInfo["input"] as? String else {
            return
        }
        scheduleOpenTool(tool, input: input)
    }
    
    /// 与 `orderOut` / 手势错开，避免菜单栏应用里抢焦点卡顿
    private func scheduleOpenTool(_ tool: ToolItem, input: String) {
        DispatchQueue.main.async {
            DispatchQueue.main.async {
                NSApp.unhide(nil)
                NSApp.activate(ignoringOtherApps: true)
                self.openToolWindow(tool, withInput: input)
            }
        }
    }
    
    /// 打开工具窗口 - 复用缓存窗口
    private func openToolWindow(_ tool: ToolItem, withInput input: String) {
        // 检查是否有缓存窗口
        if let existingPanel = toolWindows[tool.type] {
            // 复用现有窗口，更新内容
            configureToolPanel(existingPanel)
            existingPanel.title = tool.name
            let contentView = ToolDetailViewWithInput(
                tool: tool,
                initialInput: input,
                onClose: { existingPanel.close() }
            )
            existingPanel.contentView = NSHostingView(rootView: contentView)
            existingPanel.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }
        
        // 创建新窗口并缓存
        let panel = ToolHostPanel(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 440),
            styleMask: [.titled, .closable, .resizable],
            backing: .buffered,
            defer: false
        )
        
        configureToolPanel(panel)
        panel.title = tool.name
        panel.center()
        
        let contentView = ToolDetailViewWithInput(
            tool: tool,
            initialInput: input,
            onClose: { [weak self] in
                // 关闭窗口并从缓存中移除
                panel.close()
                self?.toolWindows.removeValue(forKey: tool.type)
            }
        )
        panel.contentView = NSHostingView(rootView: contentView)
        
        // 缓存窗口
        toolWindows[tool.type] = panel
        
        panel.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    
    private func configureToolPanel(_ panel: NSPanel) {
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.hidesOnDeactivate = false
        panel.becomesKeyOnlyIfNeeded = false
        panel.isReleasedWhenClosed = false
    }
}
