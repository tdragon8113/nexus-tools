import SwiftUI
import AppKit

/// 应用代理 - 管理后台任务和数据库初始化
class AppDelegate: NSObject, NSApplicationDelegate {
    // MARK: - Properties

    private var authService = AuthService.shared
    
    /// 快捷搜索窗口
    private var quickSearchWindow: QuickSearchWindow?

    // MARK: - Lifecycle

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupKeyboardShortcut()

        Task {
            await initializeDatabase()
        }

        NSApp.setActivationPolicy(.accessory)
        
        // 监听工具打开通知
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleOpenToolWithInput(_:)),
            name: NSNotification.Name("OpenToolWithInput"),
            object: nil
        )
    }

    // MARK: - Setup Methods

    private func setupKeyboardShortcut() {
        // Option + Space (keyCode 49) 打开快捷搜索
        // 使用 Option 而非 Control，避免与系统快捷键冲突
        
        // 全局监听（应用不在前台时）- 需要辅助功能权限
        NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { event in
            if event.modifierFlags.contains(.option) && event.keyCode == 49 {
                DispatchQueue.main.async {
                    self.toggleQuickSearch()
                }
            }
        }
        
        // 本地监听（应用激活时）
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            if event.modifierFlags.contains(.option) && event.keyCode == 49 {
                self.toggleQuickSearch()
                return nil // 消费事件
            }
            return event
        }
    }
    
    /// 切换快捷搜索窗口
    private func toggleQuickSearch() {
        if quickSearchWindow == nil {
            quickSearchWindow = QuickSearchWindow.shared
        }
        quickSearchWindow?.toggleWindow()
    }

    private func initializeDatabase() async {
        do {
            let _ = try await DatabaseService.shared.getDBQueue()
            Logger.info("Database ready")
        } catch {
            Logger.error("Database initialization failed: \(error)")
        }
    }
    
    // MARK: - Notification Handlers
    
    /// 处理工具打开通知（带预填充输入）
    @objc private func handleOpenToolWithInput(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let tool = userInfo["tool"] as? ToolItem,
              let input = userInfo["input"] as? String else {
            return
        }
        
        // 创建工具详情窗口并预填充输入
        openToolWindow(tool, withInput: input)
    }
    
    /// 打开工具窗口
    private func openToolWindow(_ tool: ToolItem, withInput input: String) {
        let panel = NSPanel(contentRect: NSRect(x: 0, y: 0, width: 400, height: 500),
                            styleMask: [.titled, .closable, .resizable],
                            backing: .buffered,
                            defer: false)
        
        panel.title = tool.name
        panel.center()
        
        let contentView = ToolDetailViewWithInput(tool: tool, initialInput: input)
        panel.contentView = NSHostingView(rootView: contentView)
        
        panel.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
}