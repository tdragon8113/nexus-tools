import SwiftUI

/// 快捷搜索视图 - uTools 风格的搜索界面
struct QuickSearchView: View {
    var onClose: () -> Void
    
    @State private var searchText: String = ""
    @State private var selectedTool: ToolItem?
    @FocusState private var isInputFocused: Bool
    
    // MARK: - Computed Properties
    
    /// 智能推荐的工具（根据输入内容匹配）
    private var recommendedTools: [ToolItem] {
        guard !searchText.isEmpty else { return [] }
        
        return ToolType.allCases
            .map { ToolItem(type: $0) }
            .filter { tool in
                tool.type.matchScore(for: searchText) > 0
            }
            .sorted { $0.type.matchScore(for: searchText) > $1.type.matchScore(for: searchText) }
    }
    
    /// 所有工具（按匹配度排序）
    private var allTools: [ToolItem] {
        let tools = ToolType.allCases.map { ToolItem(type: $0) }
        
        if searchText.isEmpty {
            return tools
        }
        
        // 按匹配度和名称排序
        return tools.sorted { tool1, tool2 in
            let score1 = tool1.type.matchScore(for: searchText)
            let score2 = tool2.type.matchScore(for: searchText)
            
            if score1 != score2 {
                return score1 > score2
            }
            
            // 名称匹配
            return tool1.name.localizedCaseInsensitiveContains(searchText) &&
                   !tool2.name.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    // MARK: - Body
    
    var body: some View {
        VStack(spacing: 0) {
            // 搜索输入框
            searchInputSection
            
            Divider()
                .background(Color.secondary.opacity(0.3))
            
            // 推荐工具区域
            if !recommendedTools.isEmpty {
                recommendedSection
                Divider()
                    .background(Color.secondary.opacity(0.3))
            }
            
            // 工具列表
            toolListSection
        }
        .background(windowBackground)
        .cornerRadius(12)
        .frame(width: 480, height: 400)
        .onAppear { isInputFocused = true }
    }
    
    // MARK: - Background
    
    private var windowBackground: some View {
        Rectangle()
            .fill(Color(nsColor: .windowBackgroundColor).opacity(0.95))
            .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
    }
    
    // MARK: - Search Input
    
    private var searchInputSection: some View {
        HStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 18))
                .foregroundColor(.secondary)
            
            TextField("输入内容或搜索工具...", text: $searchText)
                .textFieldStyle(.plain)
                .font(.system(size: 16))
                .focused($isInputFocused)
                .onSubmit {
                    if let tool = selectedTool ?? (recommendedTools.first ?? allTools.first) {
                        openToolWithInput(tool)
                    }
                }
            
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.borderless)
            }
            
            Text("ESC")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.secondary.opacity(0.2))
                .cornerRadius(4)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
    
    // MARK: - Recommended Section
    
    private var recommendedSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("智能推荐")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 4)
            
            ForEach(recommendedTools.prefix(3)) { tool in
                toolRow(tool, isRecommended: true)
            }
        }
    }
    
    // MARK: - Tool List
    
    private var toolListSection: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(allTools) { tool in
                    toolRow(tool, isRecommended: recommendedTools.contains(where: { $0.id == tool.id }))
                }
            }
        }
    }
    
    // MARK: - Tool Row
    
    private func toolRow(_ tool: ToolItem, isRecommended: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: tool.icon)
                .font(.system(size: 16))
                .foregroundColor(.accentColor)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(tool.name)
                    .font(.system(size: 14, weight: .medium))
                
                if isRecommended && !searchText.isEmpty {
                    Text(matchReason(tool))
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Text(tool.shortcut)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.secondary.opacity(0.15))
                .cornerRadius(4)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 0)
                .fill(selectedTool?.id == tool.id ? Color.accentColor.opacity(0.1) : Color.clear)
        )
        .contentShape(Rectangle())
        .onTapGesture { openToolWithInput(tool) }
        .onHover { hovering in
            if hovering {
                selectedTool = tool
            }
        }
    }
    
    // MARK: - Match Reason
    
    private func matchReason(_ tool: ToolItem) -> String {
        let input = searchText.trimmingCharacters(in: .whitespaces)
        
        switch tool.type {
        case .json:
            return "检测到 JSON 格式"
        case .base64:
            return "检测到 Base64 编码"
        case .url:
            return "检测到 URL 编码"
        case .timestamp:
            return "检测到时间戳"
        case .jwt:
            return "检测到 JWT Token"
        case .qrcode:
            return "可生成二维码"
        default:
            return ""
        }
    }
    
    // MARK: - Actions
    
    private func openToolWithInput(_ tool: ToolItem) {
        onClose()
        
        // 打开工具并预填充输入
        // 使用 NotificationCenter 传递数据
        NotificationCenter.default.post(
            name: NSNotification.Name("OpenToolWithInput"),
            object: nil,
            userInfo: [
                "tool": tool,
                "input": searchText
            ]
        )
    }
}

// MARK: - Preview

#Preview {
    QuickSearchView(onClose: {})
        .frame(width: 480, height: 400)
}