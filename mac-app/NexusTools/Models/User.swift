import Foundation
import GRDB

struct User: Codable, FetchableRecord, PersistableRecord {
    var id: Int64
    var username: String
    var email: String
    var sessionToken: String?
    var lastSyncAt: Date?
    var createdAt: Date

    static let databaseTableName = "users"

    enum CodingKeys: String, CodingKey {
        case id
        case username
        case email
        case sessionToken = "session_token"
        case lastSyncAt = "last_sync_at"
        case createdAt = "created_at"
    }
}