import Foundation

/// 网络服务 - 处理所有 API 请求
actor NetworkService {
    static let shared = NetworkService()

    // MARK: - Configuration

    private let baseURL: String
    private let session: URLSession
    private var sessionCookie: String?

    // MARK: - Initialization

    private init() {
        self.baseURL = AppEnvironment.current.apiBaseURL

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
    }

    // MARK: - Session Management

    func setSessionCookie(_ cookie: String) {
        self.sessionCookie = cookie
    }

    func clearSession() {
        self.sessionCookie = nil
    }

    func getSessionCookie() -> String? {
        return sessionCookie
    }

    // MARK: - HTTP Methods

    func get<T: Codable>(path: String) async throws -> T {
        let url = URL(string: baseURL + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        addAuthHeader(&request)
        return try await sendRequest(request)
    }

    func post<T: Codable, U: Codable>(path: String, body: U) async throws -> T {
        let url = URL(string: baseURL + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(&request)
        request.httpBody = try JSONEncoder().encode(body)
        return try await sendRequest(request)
    }

    func put<T: Codable, U: Codable>(path: String, body: U) async throws -> T {
        let url = URL(string: baseURL + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(&request)
        request.httpBody = try JSONEncoder().encode(body)
        return try await sendRequest(request)
    }

    func delete<T: Codable>(path: String) async throws -> T {
        let url = URL(string: baseURL + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        addAuthHeader(&request)
        return try await sendRequest(request)
    }

    // MARK: - Private Methods

    private func addAuthHeader(_ request: inout URLRequest) {
        if let cookie = sessionCookie {
            request.addValue("SESSION=\(cookie)", forHTTPHeaderField: "Cookie")
        }
    }

    private func sendRequest<T: Codable>(_ request: URLRequest) async throws -> T {
        let (data, response): (Data, URLResponse)

        do {
            (data, response) = try await session.data(for: request)
        } catch let error as URLError {
            throw mapURLError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.noConnection
        }

        // Extract session cookie from response
        extractSessionCookie(from: httpResponse)

        // Handle HTTP error status codes - try to extract error message from response
        if !(200..<300).contains(httpResponse.statusCode) {
            let errorMessage = try? extractErrorMessage(from: data)
            throw mapStatusCode(httpResponse.statusCode, message: errorMessage)
        }

        // Decode response
        do {
            let apiResponse = try JSONDecoder().decode(ApiResponse<T>.self, from: data)
            guard apiResponse.isSuccess, let result = apiResponse.data else {
                throw NetworkError.serverError(apiResponse.code)
            }
            return result
        } catch let error as DecodingError {
            Logger.error("Decode error: \(error)")
            throw NetworkError.decodeError
        }
    }

    private func extractErrorMessage(from data: Data) throws -> String? {
        struct ErrorResponse: Codable {
            let code: Int?
            let message: String?
        }
        let response = try JSONDecoder().decode(ErrorResponse.self, from: data)
        return response.message
    }

    private func mapStatusCode(_ statusCode: Int, message: String?) -> NetworkError {
        switch statusCode {
        case 401:
            return .sessionExpired
        case 403:
            return .forbidden
        case 404:
            return .notFound
        case 400..<500:
            return .validationError(message ?? "请求参数错误")
        case 500..<600:
            return .serverError(statusCode)
        default:
            return .serverError(statusCode)
        }
    }

    private func extractSessionCookie(from response: HTTPURLResponse) {
        guard let cookies = response.value(forHTTPHeaderField: "Set-Cookie") else { return }
        if let match = cookies.range(of: "SESSION=([^;]+)", options: .regularExpression) {
            sessionCookie = String(cookies[match].dropFirst("SESSION=".count))
        }
    }

    private func mapURLError(_ error: URLError) -> NetworkError {
        switch error.code {
        case .notConnectedToInternet:
            return .noConnection
        case .timedOut:
            return .timeout
        default:
            return .serverError(-1)
        }
    }
}