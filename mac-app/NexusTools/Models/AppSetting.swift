import Foundation
import GRDB

/// 应用设置模型
struct AppSetting: Codable, FetchableRecord, PersistableRecord {
    var key: String
    var value: String
    var updatedAt: Date

    static let databaseTableName = "app_settings"

    enum CodingKeys: String, CodingKey {
        case key
        case value
        case updatedAt = "updated_at"
    }

    // MARK: - Column definitions

    enum Columns {
        static let key = Column(CodingKeys.key)
        static let value = Column(CodingKeys.value)
        static let updatedAt = Column(CodingKeys.updatedAt)
    }

    // MARK: - Setting Keys

    enum SettingKey: String {
        case apiServer = "api_server"
        case lastSyncTime = "last_sync_time"
        case theme = "theme"
        case language = "language"
        case notificationsEnabled = "notifications_enabled"
    }
}