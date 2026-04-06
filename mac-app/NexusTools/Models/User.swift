import Foundation
import GRDB

/// 用户模型
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

    // MARK: - Column definitions for queries

    enum Columns {
        static let id = Column(CodingKeys.id)
        static let username = Column(CodingKeys.username)
        static let email = Column(CodingKeys.email)
        static let sessionToken = Column(CodingKeys.sessionToken)
        static let lastSyncAt = Column(CodingKeys.lastSyncAt)
        static let createdAt = Column(CodingKeys.createdAt)
    }

    // MARK: - Factory methods

    /// 创建新用户
    static func create(username: String, email: String) -> User {
        User(
            id: 0,
            username: username,
            email: email,
            sessionToken: nil,
            lastSyncAt: nil,
            createdAt: Date()
        )
    }
}