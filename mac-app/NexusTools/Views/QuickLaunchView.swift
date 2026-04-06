import SwiftUI

struct QuickLaunchView: View {
    @State private var searchText = ""

    let tools: [ToolItem] = [
        ToolItem(name: "JSON 工具", icon: "doc.text", shortcut: "Cmd+J", requiresLargeWindow: false),
        ToolItem(name: "Base64", icon: "key", shortcut: "Cmd+B", requiresLargeWindow: false),
        ToolItem(name: "Hash 生成", icon: "hash", shortcut: "Cmd+H", requiresLargeWindow: false),
        ToolItem(name: "JWT 解析", icon: "key.fill", shortcut: "Cmd+W", requiresLargeWindow: false),
        ToolItem(name: "待办事项", icon: "checklist", shortcut: "Cmd+T", requiresLargeWindow: false),
        ToolItem(name: "Markdown", icon: "doc.richtext", shortcut: "Cmd+M", requiresLargeWindow: true),
        ToolItem(name: "时间追踪", icon: "clock", shortcut: "Cmd+R", requiresLargeWindow: false),
        ToolItem(name: "统计报告", icon: "chart.bar", shortcut: "Cmd+S", requiresLargeWindow: true),
    ]

    var filteredTools: [ToolItem] {
        if searchText.isEmpty {
            return tools
        }
        return tools.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                TextField("搜索工具...", text: $searchText)
                    .textFieldStyle(.plain)
            }
            .padding(12)
            .background(Color(nsColor: .controlBackgroundColor))

            Divider()

            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(filteredTools) { tool in
                        ToolRow(tool: tool)
                            .background(Color.clear)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                openTool(tool)
                            }
                    }
                }
            }
            .frame(maxHeight: 400)
        }
        .frame(width: 400)
        .background(Color(nsColor: .windowBackgroundColor))
    }

    private func openTool(_ tool: ToolItem) {
        print("Opening: \(tool.name)")
    }
}

struct ToolItem: Identifiable {
    let id = UUID()
    let name: String
    let icon: String
    let shortcut: String
    let requiresLargeWindow: Bool
}

struct ToolRow: View {
    let tool: ToolItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: tool.icon)
                .font(.system(size: 20))
                .foregroundColor(.accentColor)
                .frame(width: 32)

            Text(tool.name)
                .font(.system(size: 14, weight: .medium))

            Spacer()

            Text(tool.shortcut)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(nsColor: .controlBackgroundColor))
                .cornerRadius(4)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}

#Preview {
    QuickLaunchView()
}