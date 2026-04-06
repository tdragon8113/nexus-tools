import Foundation
import GRDB

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
}