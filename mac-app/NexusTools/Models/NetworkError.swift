import Foundation

/// 网络请求错误类型
enum NetworkError: Error, LocalizedError {
    case noConnection
    case sessionExpired
    case serverError(Int)
    case timeout
    case decodeError
    case unauthorized
    case forbidden
    case notFound
    case validationError(String)

    var errorDescription: String? {
        switch self {
        case .noConnection:
            return "无法连接到服务器"
        case .sessionExpired:
            return "会话已过期，请重新登录"
        case .serverError(let code):
            return "服务器错误 (\(code))"
        case .timeout:
            return "请求超时"
        case .decodeError:
            return "数据解析失败"
        case .unauthorized:
            return "未授权访问"
        case .forbidden:
            return "禁止访问"
        case .notFound:
            return "资源不存在"
        case .validationError(let message):
            return message
        }
    }
}