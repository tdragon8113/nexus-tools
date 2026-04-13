import SwiftUI
import AppKit

/// 快捷搜索窗口管理器 - 类似 Spotlight/uTools 的悬浮窗口
class QuickSearchWindow: NSPanel {
    static let shared = QuickSearchWindow()
    
    private var hostingView: NSHostingView<QuickSearchView>?
    
    // MARK: - Initialization
    
    override init(contentRect: NSRect, styleMask style: NSWindow.StyleMask, backing backingStoreType: NSWindow.BackingStoreType, defer flag: Bool) {
        // 初始化为无边框 Panel
        super.init(
            contentRect: NSRect(x: 0, y: 0, width: 480, height: 400),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        
        setupWindow()
    }
    
    private func setupWindow() {
        // 窗口属性
        isFloatingPanel = true
        level = .floating
        collectionBehavior = [.canJoinAllSpaces, .transient, .fullScreenAuxiliary]
        isOpaque = false
        backgroundColor = .clear
        hasShadow = true
        
        // 允许键盘事件
        acceptsMouseMovedEvents = true
        becomesKeyOnlyIfNeeded = false
        
        // 失焦关闭
        hidesOnDeactivate = true
        
        // 居中显示
        center()
        
        // 创建 SwiftUI 视图
        let contentView = QuickSearchView(onClose: { self.hideWindow() })
        hostingView = NSHostingView(rootView: contentView)
        hostingView?.frame = NSRect(x: 0, y: 0, width: 480, height: 400)
        
        // 设置内容视图
        self.contentView = hostingView
    }
    
    // MARK: - Window Control
    
    /// 显示窗口
    func showWindow() {
        makeKeyAndOrderFront(nil)
        center()
        
        // 激活应用
        NSApp.activate(ignoringOtherApps: true)
        
        // 重置搜索状态
        if let hostingView = hostingView {
            hostingView.rootView = QuickSearchView(onClose: { self.hideWindow() })
        }
    }
    
    /// 隐藏窗口
    func hideWindow() {
        orderOut(nil)
    }
    
    /// 切换窗口显示/隐藏
    func toggleWindow() {
        if isVisible {
            hideWindow()
        } else {
            showWindow()
        }
    }
    
    // MARK: - Keyboard Handling
    
    override var canBecomeKey: Bool {
        return true
    }
    
    override var canBecomeMain: Bool {
        return true
    }
    
    /// 处理键盘事件
    override func keyDown(with event: NSEvent) {
        // ESC 关闭窗口
        if event.keyCode == 53 {
            hideWindow()
            return
        }
        
        super.keyDown(with: event)
    }
}