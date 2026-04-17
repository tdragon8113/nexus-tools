import Foundation

/// 应用常量
enum Constants {
    // MARK: - App Info
    enum App {
        static let name = "Nexus Tools"
        static let bundleIdentifier = "com.nexus.NexusTools"
        static let version = "1.0.0"
    }

    // MARK: - Database
    enum Database {
        static let fileName = "nexus.db"
        static let schemaVersion: UInt64 = 1
    }

    // MARK: - API
    enum API {
        static let timeout: TimeInterval = 30
        static let maxRetryCount = 3
    }

    // MARK: - UI
    enum UI {
        static let panelWidth: CGFloat = 400
        static let panelHeight: CGFloat = 500
        static let animationDuration: TimeInterval = 0.2
    }

    // MARK: - Notifications
    enum Notification {
        /// 快捷搜索选择工具并携带输入
        static let openToolWithInput = NSNotification.Name("OpenToolWithInput")
    }
}