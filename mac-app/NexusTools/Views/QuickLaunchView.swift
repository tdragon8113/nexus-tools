import SwiftUI

/// 快捷启动视图 - CMD+K 唤起的主界面
struct QuickLaunchView: View {
    @State private var searchText = ""
    @State private var selectedCategory: ToolCategory?

    // MARK: - Tool Data

    private let tools: [ToolItem] = [
        // 开发工具
        ToolItem(name: "JSON 工具", icon: "doc.text", shortcut: "⌘J", category: .developer),
        ToolItem(name: "Base64 编解码", icon: "key", shortcut: "⌘B", category: .developer),
        ToolItem(name: "Hash 生成", icon: "hash", shortcut: "⌘H", category: .developer),
        ToolItem(name: "JWT 解析", icon: "key.fill", shortcut: "⌘W", category: .developer),
        ToolItem(name: "URL 编解码", icon: "link", shortcut: "⌘U", category: .developer),
        ToolItem(name: "正则测试", icon: "chevron.left.forwardslash.chevron.right", shortcut: "⌘R", category: .developer),
        // 效率工具
        ToolItem(name: "待办事项", icon: "checklist", shortcut: "⌘T", category: .productivity),
        ToolItem(name: "时间追踪", icon: "clock", shortcut: "⌘⇧T", category: .productivity),
        ToolItem(name: "Markdown 编辑", icon: "doc.richtext", shortcut: "⌘M", requiresLargeWindow: true, category: .productivity),
        // 实用工具
        ToolItem(name: "剪贴板历史", icon: "doc.on.clipboard", shortcut: "⌘V", category: .utility),
        ToolItem(name: "统计报告", icon: "chart.bar", shortcut: "⌘S", requiresLargeWindow: true, category: .utility),
    ]

    // MARK: - Computed Properties

    private var filteredTools: [ToolItem] {
        var result = tools
        if let category = selectedCategory {
            result = result.filter { $0.category == category }
        }
        if !searchText.isEmpty {
            result = result.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        }
        return result
    }

    // MARK: - Body

    var body: some View {
        VStack(spacing: 0) {
            searchBar
            Divider()
            categoryFilter
            Divider()
            toolList
        }
        .frame(width: 400)
        .background(Color(nsColor: .windowBackgroundColor))
    }

    // MARK: - View Components

    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            TextField("搜索工具...", text: $searchText)
                .textFieldStyle(.plain)
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .background(Color(nsColor: .controlBackgroundColor))
    }

    private var categoryFilter: some View {
        HStack(spacing: 12) {
            categoryChip(label: "全部", category: nil)
            ForEach(ToolCategory.allCases, id: \.self) { category in
                categoryChip(label: category.rawValue, category: category)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private func categoryChip(label: String, category: ToolCategory?) -> some View {
        Button(action: { selectedCategory = category }) {
            Text(label)
                .font(.system(size: 12))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(selectedCategory == category ? Color.accentColor : Color(nsColor: .controlBackgroundColor))
                .foregroundColor(selectedCategory == category ? .white : .primary)
                .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }

    private var toolList: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(filteredTools) { tool in
                    ToolRow(tool: tool)
                        .contentShape(Rectangle())
                        .onTapGesture { openTool(tool) }
                }
            }
        }
        .frame(maxHeight: 400)
    }

    // MARK: - Actions

    private func openTool(_ tool: ToolItem) {
        print("Opening: \(tool.name)")
        // TODO: 实现工具打开逻辑
    }
}

#Preview {
    QuickLaunchView()
}