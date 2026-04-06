import SwiftUI
import AppKit

/// 应用代理 - 管理菜单栏和面板
class AppDelegate: NSObject, NSApplicationDelegate {
    // MARK: - Properties

    private var statusItem: NSStatusItem?
    private var panel: NSPanel?

    // MARK: - Lifecycle

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupMenuBar()
        setupPanel()
        setupKeyboardShortcut()

        // Initialize database asynchronously
        Task {
            await initializeDatabase()
        }

        // Set as accessory app (menu bar only)
        NSApp.setActivationPolicy(.accessory)
    }

    // MARK: - Setup Methods

    private func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)

        if let button = statusItem?.button {
            let image = NSImage(systemSymbolName: "wrench.and.screwdriver", accessibilityDescription: "Nexus Tools")
            image?.isTemplate = true
            button.image = image
            button.action = #selector(togglePanel)
            button.target = self
        }
    }

    private func setupPanel() {
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: Constants.UI.panelWidth, height: Constants.UI.panelHeight),
            styleMask: [.titled, .closable, .nonactivatingPanel, .hudWindow],
            backing: .buffered,
            defer: false
        )

        panel.isFloatingPanel = true
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.isMovableByWindowBackground = true
        panel.title = Constants.App.name

        // Position panel near menu bar
        if let screen = NSScreen.main {
            let screenFrame = screen.frame
            let xPosition = screenFrame.width - Constants.UI.panelWidth - 20
            let yPosition = screenFrame.height - Constants.UI.panelHeight - 60
            panel.setFrameOrigin(NSPoint(x: xPosition, y: yPosition))
        }

        panel.contentView = NSHostingView(rootView: QuickLaunchView())
        self.panel = panel
    }

    private func setupKeyboardShortcut() {
        // Global keyboard shortcut for CMD+K
        NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            // Check for CMD+K
            if event.modifierFlags.contains(.command) && event.keyCode == 40 { // keyCode 40 = 'k'
                self?.togglePanel()
            }
        }
    }

    private func initializeDatabase() async {
        do {
            let _ = try await DatabaseService.shared.getDBQueue()
            Logger.info("Database ready")
        } catch {
            Logger.error("Database initialization failed: \(error)")
        }
    }

    // MARK: - Actions

    @objc func togglePanel() {
        if panel?.isVisible == true {
            hidePanel()
        } else {
            showPanel()
        }
    }

    @objc func showPanel() {
        panel?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func hidePanel() {
        panel?.orderOut(nil)
    }

    // MARK: - Menu

    func createMenu() -> NSMenu {
        let menu = NSMenu()

        let openItem = NSMenuItem(
            title: "打开 Nexus Tools",
            action: #selector(showPanel),
            keyEquivalent: "k"
        )
        openItem.target = self
        menu.addItem(openItem)

        menu.addItem(NSMenuItem.separator())

        let quitItem = NSMenuItem(
            title: "退出",
            action: #selector(NSApp.terminate),
            keyEquivalent: "q"
        )
        menu.addItem(quitItem)

        return menu
    }
}