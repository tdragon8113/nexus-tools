import Foundation

// MARK: - Login Request

struct LoginRequest: Codable {
    let username: String
    let password: String
}

// MARK: - Register Request

struct RegisterRequest: Codable {
    let username: String
    let email: String
    let password: String
}