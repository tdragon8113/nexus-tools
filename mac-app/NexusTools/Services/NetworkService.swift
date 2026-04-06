import Foundation

enum NetworkError: Error {
    case noConnection
    case sessionExpired
    case serverError(Int)
    case timeout
    case decodeError
}

struct ApiResponse<T: Codable>: Codable {
    let code: Int
    let message: String
    let data: T?
}

class NetworkService {
    static let shared = NetworkService()

    private let baseURL = "http://localhost:8080/api/v1"
    private let session: URLSession
    private var sessionCookie: String?

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }

    func setSessionCookie(_ cookie: String) {
        self.sessionCookie = cookie
    }

    func get<T: Codable>(path: String) async throws -> T {
        let url = URL(string: baseURL + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        if let cookie = sessionCookie {
            request.addValue("SESSION=\(cookie)", forHTTPHeaderField: "Cookie")
        }

        return try await sendRequest(request)
    }

    func post<T: Codable, U: Codable>(path: String, body: U) async throws -> T {
        let url = URL(string: baseURL + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        if let cookie = sessionCookie {
            request.addValue("SESSION=\(cookie)", forHTTPHeaderField: "Cookie")
        }

        request.httpBody = try JSONEncoder().encode(body)

        return try await sendRequest(request)
    }

    private func sendRequest<T: Codable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.noConnection
        }

        if let cookies = httpResponse.value(forHTTPHeaderField: "Set-Cookie") {
            if let match = cookies.range(of: "SESSION=([^;]+)", options: .regularExpression) {
                sessionCookie = String(cookies[match].dropFirst("SESSION=".count))
            }
        }

        if httpResponse.statusCode == 401 {
            throw NetworkError.sessionExpired
        }

        if httpResponse.statusCode >= 500 {
            throw NetworkError.serverError(httpResponse.statusCode)
        }

        let apiResponse = try JSONDecoder().decode(ApiResponse<T>.self, from: data)

        if apiResponse.code != 200 {
            throw NetworkError.serverError(apiResponse.code)
        }

        guard let result = apiResponse.data else {
            throw NetworkError.decodeError
        }

        return result
    }
}