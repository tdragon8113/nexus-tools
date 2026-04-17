import Foundation

/// 工具类型枚举 - 标识具体工具
enum ToolType: String, CaseIterable, Codable {
    case json = "json"
    case base64 = "base64"
    case hash = "hash"
    case url = "url"
    case timestamp = "timestamp"
    case qrcode = "qrcode"
    case jwt = "jwt"
    case regex = "regex"
    case markdown = "markdown"
    case clipboard = "clipboard"
    case todo = "todo"
    case timeTracker = "timeTracker"

    /// 是否需要大窗口
    var requiresLargeWindow: Bool {
        switch self {
        case .markdown, .regex, .timeTracker: return true
        default: return false
        }
    }

    /// 工具显示名称
    var displayName: String {
        switch self {
        case .json: return "JSON 工具"
        case .base64: return "Base64 编解码"
        case .hash: return "Hash 生成"
        case .url: return "URL 编解码"
        case .timestamp: return "时间戳转换"
        case .qrcode: return "二维码生成"
        case .jwt: return "JWT 解析"
        case .regex: return "正则测试"
        case .markdown: return "Markdown 编辑"
        case .clipboard: return "剪贴板历史"
        case .todo: return "待办事项"
        case .timeTracker: return "时间追踪"
        }
    }

    /// 工具图标
    var icon: String {
        switch self {
        case .json: return "doc.text"
        case .base64: return "key"
        case .hash: return "number"  // SF Symbols 没有 hash，用 number 替代
        case .url: return "link"
        case .timestamp: return "clock"
        case .qrcode: return "qrcode"
        case .jwt: return "key.fill"
        case .regex: return "chevron.left.forwardslash.chevron.right"
        case .markdown: return "doc.richtext"
        case .clipboard: return "doc.on.clipboard"
        case .todo: return "checklist"
        case .timeTracker: return "clock.arrow.circlepath"
        }
    }

    /// 所属分类
    var category: ToolCategory {
        switch self {
        case .json, .base64, .hash, .url, .timestamp, .qrcode, .jwt, .regex:
            return .developer
        case .todo, .timeTracker, .markdown:
            return .productivity
        case .clipboard:
            return .utility
        }
    }

    /// 智能匹配评分 - 根据输入内容特征计算匹配度
    func matchScore(for input: String) -> Int {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !trimmed.isEmpty else { return 0 }
        
        switch self {
        case .json:
            // JSON 格式检测
            if trimmed.hasPrefix("{") || trimmed.hasPrefix("[") {
                if trimmed.hasSuffix("}") || trimmed.hasSuffix("]") {
                    return 100
                }
                return 80
            }
            return 0
            
        case .base64:
            // Base64 检测：字母数字+/-，长度4倍数，无空格
            if Self.isLikelyBase64(trimmed) {
                return 90
            }
            return 0
            
        case .url:
            // URL 编码检测
            if trimmed.contains("%") && trimmed.contains("=") || trimmed.contains("%20") {
                return 95
            }
            if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") {
                return 50 // URL 可以用二维码
            }
            return 0
            
        case .timestamp:
            // 时间戳检测：纯数字，10-13位
            if trimmed.allSatisfy { $0.isNumber } {
                let count = trimmed.count
                if count == 10 || count == 13 { // 秒或毫秒
                    return 95
                }
                if count >= 9 && count <= 14 {
                    return 70
                }
            }
            return 0
            
        case .jwt:
            // JWT 检测：以 eyJ 开头，三段结构
            if trimmed.hasPrefix("eyJ") && trimmed.split(separator: ".").count == 3 {
                return 100
            }
            return 0
            
        case .qrcode:
            // 二维码适合 URL 或文本
            if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") {
                return 85
            }
            if trimmed.count > 10 && trimmed.count < 100 {
                return 40
            }
            return 0
            
        case .hash:
            // Hash 输入：任意文本
            return 30
            
        case .clipboard:
            // 剪贴板历史
            return 10
            
        case .regex, .markdown, .todo, .timeTracker:
            return 0
        }
    }
    
    /// 检测是否可能是 Base64 编码
    private static func isLikelyBase64(_ text: String) -> Bool {
        // Base64 特征：
        // 1. 只包含 A-Za-z0-9+/=
        // 2. 长度是 4 的倍数
        // 3. 不包含空格
        
        guard !text.isEmpty else { return false }
        
        let base64Chars = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=")
        
        // 检查字符集
        if !text.unicodeScalars.allSatisfy { base64Chars.contains($0) } {
            return false
        }
        
        // 检查长度
        if text.count % 4 != 0 {
            return false
        }
        
        // 最小长度
        if text.count < 8 {
            return false
        }
        
        return true
    }
}

/// 工具项模型
struct ToolItem: Identifiable, Hashable, Codable {
    let id: UUID
    let type: ToolType

    /// 是否需要大窗口（从 ToolType 获取）
    var requiresLargeWindow: Bool {
        type.requiresLargeWindow
    }

    /// 工具名称
    var name: String {
        type.displayName
    }

    /// 工具图标
    var icon: String {
        type.icon
    }

    /// 所属分类
    var category: ToolCategory {
        type.category
    }

    init(id: UUID = UUID(), type: ToolType) {
        self.id = id
        self.type = type
    }

    /// 从 ToolType 创建
    static func from(type: ToolType) -> ToolItem {
        ToolItem(type: type)
    }

    /// 所有可用工具
    static let allTools: [ToolItem] = ToolType.allCases.map { ToolItem(type: $0) }
}

/// 工具分类
enum ToolCategory: String, CaseIterable, Codable {
    case developer = "开发工具"
    case productivity = "效率工具"
    case utility = "实用工具"

    var icon: String {
        switch self {
        case .developer: return "chevron.left.forwardslash.chevron.right"
        case .productivity: return "clock"
        case .utility: return "wrench.and.screwdriver"
        }
    }
}