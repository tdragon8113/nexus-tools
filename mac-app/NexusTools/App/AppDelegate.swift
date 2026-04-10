import SwiftUI
import AppKit

/// 应用代理 - 管理后台任务和数据库初始化
class AppDelegate: NSObject, NSApplicationDelegate {
    // MARK: - Properties

    private var authService = AuthService.shared

    // MARK: - Lifecycle

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupKeyboardShortcut()

        Task {
            await initializeDatabase()
        }

        NSApp.setActivationPolicy(.accessory)
    }

    // MARK: - Setup Methods

    private func setupKeyboardShortcut() {
        NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { event in
            if event.modifierFlags.contains(.command) && event.keyCode == 40 {
                // CMD+K - 由 MenuBarExtra 处理
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
}