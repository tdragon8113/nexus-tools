import GRDB
import Foundation

/// 数据库错误
enum DatabaseError: Error, LocalizedError {
    case initializationFailed(Error)
    case connectionFailed
    case queryFailed(Error)
    case recordNotFound
    case migrationFailed(Error)

    var errorDescription: String? {
        switch self {
        case .initializationFailed(let error):
            return "数据库初始化失败: \(error.localizedDescription)"
        case .connectionFailed:
            return "无法连接到数据库"
        case .queryFailed(let error):
            return "查询失败: \(error.localizedDescription)"
        case .recordNotFound:
            return "记录不存在"
        case .migrationFailed(let error):
            return "数据库迁移失败: \(error.localizedDescription)"
        }
    }
}

/// 数据库服务 - 管理 GRDB 数据库连接
actor DatabaseService {
    static let shared = DatabaseService()

    // MARK: - Properties

    private var dbQueue: DatabaseQueue?
    private let schemaVersion: UInt64 = 1

    // MARK: - Initialization

    private init() {
        do {
            try setupDatabase()
            Logger.info("Database initialized successfully")
        } catch {
            Logger.error("Database initialization failed: \(error)")
        }
    }

    // MARK: - Setup

    private func setupDatabase() throws {
        let fileManager = FileManager.default

        guard let appSupportURL = try? fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        ) else {
            throw DatabaseError.connectionFailed
        }

        let dbDirectory = appSupportURL.appendingPathComponent("NexusTools")
        let dbURL = dbDirectory.appendingPathComponent(Constants.Database.fileName)

        // Create directory if needed
        if !fileManager.fileExists(atPath: dbDirectory.path) {
            try fileManager.createDirectory(at: dbDirectory, withIntermediateDirectories: true)
        }

        // Create database queue
        dbQueue = try DatabaseQueue(path: dbURL.path)

        // Run migrations
        try runMigrations()
    }

    // MARK: - Migrations

    private func runMigrations() throws {
        var migrator = DatabaseMigrator()

        // Version 1: Initial schema
        migrator.registerMigration("v1_initial_schema") { db in
            // Users table
            try db.create(table: "users") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("username", .text).notNull().unique()
                t.column("email", .text).notNull().unique()
                t.column("session_token", .text)
                t.column("last_sync_at", .datetime)
                t.column("created_at", .datetime).notNull()
            }

            // Sync metadata table
            try db.create(table: "sync_metadata") { t in
                t.column("entity_type", .text).primaryKey()
                t.column("last_sync_version", .integer)
                t.column("last_sync_at", .datetime)
            }

            // App settings table
            try db.create(table: "app_settings") { t in
                t.column("key", .text).primaryKey()
                t.column("value", .text).notNull()
                t.column("updated_at", .datetime).notNull()
            }

            // Todos table (for future feature)
            try db.create(table: "todos") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("title", .text).notNull()
                t.column("description", .text)
                t.column("is_completed", .boolean).notNull().defaults(to: false)
                t.column("priority", .integer).notNull().defaults(to: 0)
                t.column("due_date", .datetime)
                t.column("created_at", .datetime).notNull()
                t.column("updated_at", .datetime).notNull()
            }

            Logger.info("Database schema v1 created")
        }

        try migrator.migrate(dbQueue!)
    }

    // MARK: - Database Access

    /// 获取数据库队列
    func getDBQueue() throws -> DatabaseQueue {
        guard let dbQueue = dbQueue else {
            throw DatabaseError.connectionFailed
        }
        return dbQueue
    }

    /// 执行读操作
    func read<T>(_ block: (Database) throws -> T) throws -> T {
        guard let dbQueue = dbQueue else {
            throw DatabaseError.connectionFailed
        }
        return try dbQueue.read(block)
    }

    /// 执行写操作
    func write<T>(_ block: (Database) throws -> T) throws -> T {
        guard let dbQueue = dbQueue else {
            throw DatabaseError.connectionFailed
        }
        return try dbQueue.write(block)
    }

    // MARK: - User Operations

    func saveUser(_ user: User) throws {
        try write { db in
            try user.insert(db)
        }
    }

    func getCurrentUser() throws -> User? {
        try read { db in
            try User.fetchOne(db)
        }
    }

    func deleteUser() throws {
        try write { db in
            _ = try User.deleteAll(db)
        }
    }

    // MARK: - Settings Operations

    func getSetting(key: String) throws -> String? {
        try read { db in
            guard let setting = try AppSetting.filter(Column("key") == key).fetchOne(db) else {
                return nil
            }
            return setting.value
        }
    }

    func setSetting(key: String, value: String) throws {
        try write { db in
            let setting = AppSetting(key: key, value: value, updatedAt: Date())
            try setting.upsert(db)
        }
    }

    // MARK: - Database Maintenance

    /// 检查数据库完整性
    func checkIntegrity() async throws -> Bool {
        try read { db in
            let result = try Row.fetchOne(db, sql: "PRAGMA integrity_check")
            return result?["integrity_check"] as? String == "ok"
        }
    }

    /// 清理过期数据
    func cleanupOldData() async throws {
        try write { db in
            // Clean up old sync metadata
            let threshold = Date().addingTimeInterval(-30 * 24 * 60 * 60) // 30 days ago
            try db.execute(
                sql: "DELETE FROM sync_metadata WHERE last_sync_at < ?",
                arguments: [threshold]
            )
            Logger.info("Cleaned up old sync metadata")
        }
    }

    /// 导出数据库
    func exportDatabase(to url: URL) async throws {
        guard let dbQueue = dbQueue else {
            throw DatabaseError.connectionFailed
        }
        try FileManager.default.copyItem(at: URL(fileURLWithPath: dbQueue.path), to: url)
        Logger.info("Database exported to \(url.path)")
    }
}