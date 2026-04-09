import Foundation

/// 认证服务 - 管理用户登录状态
@Observable
final class AuthService {
    // MARK: - Singleton

    static let shared = AuthService()

    // MARK: - Properties

    private(set) var currentUser: User?
    private(set) var isLoggedIn: Bool = false
    private(set) var isLoading: Bool = false
    private(set) var errorMessage: String?

    private let networkService = NetworkService.shared
    private let databaseService = DatabaseService.shared

    // MARK: - Initialization

    private init() {
        Task {
            await loadSavedSession()
        }
    }

    // MARK: - Session Management

    private func loadSavedSession() async {
        do {
            let dbQueue = try await databaseService.getDBQueue()
            let savedUser = try await dbQueue.read { db in
                try User.fetchOne(db)
            }

            if let user = savedUser, user.sessionToken != nil {
                self.currentUser = user
                self.isLoggedIn = true
                await networkService.setSessionCookie(user.sessionToken!)
            }
        } catch {
            Logger.error("Failed to load saved session: \(error)")
        }
    }

    private func saveSession(_ user: User, token: String) async {
        do {
            let dbQueue = try await databaseService.getDBQueue()
            try await dbQueue.write { db in
                // Clear existing users
                _ = try User.deleteAll(db)
                // Save new user with token
                var userToSave = user
                userToSave.sessionToken = token
                try userToSave.insert(db)
            }
        } catch {
            Logger.error("Failed to save session: \(error)")
        }
    }

    private func clearSession() async {
        do {
            let dbQueue = try await databaseService.getDBQueue()
            try await dbQueue.write { db in
                _ = try User.deleteAll(db)
            }
        } catch {
            Logger.error("Failed to clear session: \(error)")
        }
    }

    // MARK: - Auth Actions

    func login(username: String, password: String) async {
        await performAuthAction { [weak self] in
            guard let self else { return }
            let request = LoginRequest(username: username, password: password)
            let user: User = try await self.networkService.post(path: "/auth/login", body: request)
            self.currentUser = user
            if let token = await self.networkService.getSessionCookie() {
                await self.saveSession(user, token: token)
            }
        }
    }

    func register(username: String, email: String, password: String) async {
        await performAuthAction { [weak self] in
            guard let self else { return }
            let request = RegisterRequest(username: username, email: email, password: password)
            let user: User = try await self.networkService.post(path: "/auth/register", body: request)
            self.currentUser = user
        }
    }

    func logout() async {
        do {
            let _: ApiResponse<EmptyResponse> = try await networkService.post(path: "/auth/logout", body: EmptyRequest())
            await networkService.clearSession()
            await clearSession()
            currentUser = nil
            isLoggedIn = false
        } catch {
            Logger.error("Logout failed: \(error)")
            // Still clear local session even if server logout fails
            await networkService.clearSession()
            await clearSession()
            currentUser = nil
            isLoggedIn = false
        }
    }

    func deleteAccount() async throws {
        let _: ApiResponse<EmptyResponse> = try await networkService.delete(path: "/auth/account")
        await networkService.clearSession()
        await clearSession()
        currentUser = nil
        isLoggedIn = false
    }

    func fetchCurrentUser() async {
        do {
            let user: User = try await networkService.get(path: "/auth/me")
            self.currentUser = user
        } catch {
            Logger.error("Failed to fetch user: \(error)")
        }
    }

    // MARK: - Private Helpers

    private func performAuthAction(_ action: @escaping () async throws -> Void) async {
        isLoading = true
        errorMessage = nil

        do {
            try await action()
            isLoggedIn = true
        } catch {
            errorMessage = error.localizedDescription
            Logger.error("Auth action failed: \(error)")
        }

        isLoading = false
    }
}

// MARK: - Empty Types

private struct EmptyRequest: Codable {}
private struct EmptyResponse: Codable {}