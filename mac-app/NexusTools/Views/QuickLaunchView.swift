import SwiftUI

/// 快捷启动视图 - CMD+K 唤起的主界面
struct QuickLaunchView: View {
    @Environment(AuthService.self) private var authService

    @State private var searchText = ""
    @State private var selectedCategory: ToolCategory?
    @State private var currentView: ViewMode = .main
    @State private var selectedTool: ToolItem?  // 用于触发 Sheet
    @State private var showToolSheet = false    // Sheet 状态

    enum ViewMode {
        case main
        case auth
        case settings
    }

    // MARK: - Tool Data

    /// 所有可用工具（从 ToolItem.allTools 获取）
    private var tools: [ToolItem] {
        ToolItem.allTools
    }

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
        Group {
            switch currentView {
            case .main:
                mainView
            case .auth:
                AuthView(onBack: { currentView = .main })
            case .settings:
                SettingsView(onBack: { currentView = .main })
            }
        }
        .frame(width: 280)
        .onChange(of: authService.isLoggedIn) { _, isLoggedIn in
            if isLoggedIn {
                currentView = .main
            }
        }
        // 工具详情 Sheet
        .sheet(item: $selectedTool) { tool in
            ToolDetailView(tool: tool)
        }
    }

    private var mainView: some View {
        VStack(spacing: 0) {
            // User Info Header
            if let user = authService.currentUser {
                userInfoHeader(user)
                Divider()
            }

            searchBar
            Divider()
            categoryFilter
            Divider()
            toolList
            
            Divider()
            
            // Footer
            HStack {
                Button(action: { currentView = .settings }) {
                    Image(systemName: "gearshape")
                }
                .buttonStyle(.borderless)
                .help("设置")
                
                Spacer()
                
                if authService.isLoggedIn {
                    Button("退出登录") {
                        Task { await authService.logout() }
                    }
                    .buttonStyle(.borderless)
                    .font(.system(size: 12))
                } else {
                    Button(action: { currentView = .auth }) {
                        Label("登录同步", systemImage: "icloud")
                    }
                    .buttonStyle(.borderless)
                    .font(.system(size: 12))
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
        }
    }

    // MARK: - View Components

    private func userInfoHeader(_ user: User) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "person.circle.fill")
                .font(.system(size: 20))
                .foregroundColor(.accentColor)

            VStack(alignment: .leading, spacing: 2) {
                Text(user.username)
                    .font(.system(size: 13, weight: .medium))
                Text(user.email)
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private var searchBar: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 11))
                .foregroundColor(.secondary)
            TextField("搜索工具...", text: $searchText)
                .textFieldStyle(.roundedBorder)
                .font(.system(size: 12))
            
            // 快捷搜索按钮
            Button(action: { QuickSearchWindow.shared.toggleWindow() }) {
                Image(systemName: "sparkle.magnifyingglass")
                    .font(.system(size: 11))
                    .foregroundColor(.accentColor)
            }
            .buttonStyle(.borderless)
            .help("智能搜索 (⌥空格)")
            
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.borderless)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private var categoryFilter: some View {
        HStack(spacing: 8) {
            categoryChip(label: "全部", category: nil)
            ForEach(ToolCategory.allCases, id: \.self) { category in
                categoryChip(label: category.rawValue, category: category)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }

    private func categoryChip(label: String, category: ToolCategory?) -> some View {
        Button(action: { selectedCategory = category }) {
            Text(label)
                .font(.system(size: 11))
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(selectedCategory == category ? Color.accentColor : Color.secondary.opacity(0.2))
                .foregroundColor(selectedCategory == category ? .white : .primary)
                .clipShape(RoundedRectangle(cornerRadius: 4))
        }
        .buttonStyle(.borderless)
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
        .frame(maxHeight: 300)
    }

    // MARK: - Actions

    private func openTool(_ tool: ToolItem) {
        selectedTool = tool
    }
}

// MARK: - Settings View

struct SettingsView: View {
    @Environment(AuthService.self) private var authService
    var onBack: () -> Void
    @State private var showDeleteConfirmation = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14))
                }
                .buttonStyle(.borderless)
                
                Spacer()
                
                Text("设置")
                    .font(.system(size: 14, weight: .semibold))
                
                Spacer()
                
                // Placeholder for symmetry
                Image(systemName: "chevron.left")
                    .font(.system(size: 14))
                    .opacity(0)
            }
            .padding()
            
            Divider()
            
            ScrollView {
                VStack(spacing: 16) {
                    if let user = authService.currentUser {
                        // User Info
                        VStack(spacing: 12) {
                            Image(systemName: "person.circle.fill")
                                .font(.system(size: 64))
                                .foregroundColor(.accentColor)

                            Text(user.username)
                                .font(.system(size: 15, weight: .medium))

                            Text(user.email)
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)

                            if let nickname = user.nickname, !nickname.isEmpty {
                                Text(nickname)
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity)
                        .background(Color.secondary.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                        Divider()

                        // Actions
                        VStack(spacing: 10) {
                            Button(action: logout) {
                                HStack {
                                    Image(systemName: "rectangle.portrait.and.arrow.right")
                                        .font(.system(size: 12))
                                    Text("退出登录")
                                        .font(.system(size: 13))
                                }
                                .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)

                            Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                                HStack {
                                    Image(systemName: "trash")
                                        .font(.system(size: 12))
                                    Text("注销账号")
                                        .font(.system(size: 13))
                                }
                                .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                        }
                    } else {
                        // Not logged in
                        VStack(spacing: 16) {
                            Image(systemName: "icloud")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)

                            Text("登录以同步数据")
                                .font(.system(size: 14, weight: .medium))

                            Text("登录后可在多设备间同步您的数据")
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.vertical, 24)
                    }
                    
                    Spacer()
                }
                .padding()
            }
        }
        .confirmationDialog("确定要注销账号吗？", isPresented: $showDeleteConfirmation) {
            Button("注销账号", role: .destructive) {
                deleteAccount()
            }
            Button("取消", role: .cancel) {}
        } message: {
            Text("此操作不可撤销，您的所有数据将被永久删除。")
        }
    }

    private func logout() {
        Task {
            await authService.logout()
        }
    }

    private func deleteAccount() {
        Task {
            try? await authService.deleteAccount()
        }
    }
}

#Preview {
    QuickLaunchView()
        .environment(AuthService.shared)
}