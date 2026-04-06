import GRDB
import Foundation

class DatabaseService {
    static let shared = DatabaseService()

    private var dbQueue: DatabaseQueue?

    private init() {
        setupDatabase()
    }

    private func setupDatabase() {
        let fileManager = FileManager.default
        let appSupportURL = try! fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )

        let dbURL = appSupportURL.appendingPathComponent("NexusTools/nexus.db")

        try! fileManager.createDirectory(
            at: dbURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )

        dbQueue = try! DatabaseQueue(path: dbURL.path)

        try! dbQueue!.write { db in
            try createTables(db)
        }
    }

    private func createTables(_ db: Database) throws {
        try db.create(table: "users", body: { t in
            t.autoIncrementedPrimaryKey("id")
            t.column("username", .text).notNull()
            t.column("email", .text).notNull()
            t.column("session_token", .text)
            t.column("last_sync_at", .datetime)
            t.column("created_at", .datetime).notNull()
        })

        try db.create(table: "sync_metadata", body: { t in
            t.column("entity_type", .text).primaryKey()
            t.column("last_sync_version", .integer)
            t.column("last_sync_at", .datetime)
        })

        try db.create(table: "app_settings", body: { t in
            t.column("key", .text).primaryKey()
            t.column("value", .text).notNull()
            t.column("updated_at", .datetime).notNull()
        })
    }

    func getDBQueue() -> DatabaseQueue {
        return dbQueue!
    }
}