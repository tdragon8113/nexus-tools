import Foundation
import GRDB

/// 用户模型
struct User: Codable, FetchableRecord, PersistableRecord, Identifiable {
    var id: Int64
    var username: String
    var email: String
    var nickname: String?
    var avatarUrl: String?
    var sessionToken: String?
    var lastSyncAt: Date?
    var createdAt: Date?

    static let databaseTableName = "users"

    enum CodingKeys: String, CodingKey {
        case id
        case username
        case email
        case nickname
        case avatarUrl
        case sessionToken = "session_token"
        case lastSyncAt = "last_sync_at"
        case createdAt = "/Users/tangdinglong/PersonalProjects/nexus-tools/mac-app/NexusTools/Models/User.swiftcreated_at"
    }

    // MARK: - Column definitions for queries

    enum Columns {
        static let id = Column(CodingKeys.id)
        static let username = Column(CodingKeys.username)
        static let email = Column(CodingKeys.email)
        static let nickname = Column(CodingKeys.nickname)
        static let avatarUrl = Column(CodingKeys.avatarUrl)
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
            nickname: nil,
            avatarUrl: nil,
            sessionToken: nil,
            lastSyncAt: nil,
            createdAt: Date()
        )
    }
}
