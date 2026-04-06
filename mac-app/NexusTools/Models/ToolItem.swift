import Foundation

/// 工具项模型
struct ToolItem: Identifiable, Hashable {
    let id: UUID
    let name: String
    let icon: String
    let shortcut: String
    let requiresLargeWindow: Bool
    let category: ToolCategory

    init(
        id: UUID = UUID(),
        name: String,
        icon: String,
        shortcut: String,
        requiresLargeWindow: Bool = false,
        category: ToolCategory = .developer
    ) {
        self.id = id
        self.name = name
        self.icon = icon
        self.shortcut = shortcut
        self.requiresLargeWindow = requiresLargeWindow
        self.category = category
    }
}

/// 工具分类
enum ToolCategory: String, CaseIterable {
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