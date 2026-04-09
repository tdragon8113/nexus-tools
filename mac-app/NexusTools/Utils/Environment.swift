import Foundation

/// 应用环境配置
enum AppEnvironment {
    case development
    case staging
    case production

    /// 当前环境
    static var current: AppEnvironment {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }

    /// API 基础 URL
    var apiBaseURL: String {
        switch self {
        case .development:
            return "http://localhost:8080/api/v1"
        case .staging:
            return "https://staging-api.nexus-tools.com/api/v1"
        case .production:
            return "https://api.nexus-tools.com/api/v1"
        }
    }

    /// 是否启用调试日志
    var enableDebugLogging: Bool {
        switch self {
        case .development, .staging:
            return true
        case .production:
            return false
        }
    }

    /// 是否启用网络调试
    var enableNetworkDebugging: Bool {
        switch self {
        case .development:
            return true
        case .staging, .production:
            return false
        }
    }
}