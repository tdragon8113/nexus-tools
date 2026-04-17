import SwiftUI
import AppKit

/// 菜单栏设置视图 - 简洁的设置面板
struct MenuBarSettingsView: View {
    @Environment(AuthService.self) private var authService
    @State private var currentView: ViewMode = .main
    @State private var showDeleteConfirmation = false

    enum ViewMode {
        case main
        case login
        case register
        case settings
    }
    
    var body: some View {
        Group {
            switch currentView {
            case .main:
                mainView
            case .login:
                loginView
            case .register:
                registerView
            case .settings:
                settingsView
            }
        }
        .frame(width: 260)
        .animation(.easeInOut(duration: 0.25), value: currentView)
        .confirmationDialog("确定要注销账号吗？", isPresented: $showDeleteConfirmation) {
            Button("注销账号", role: .destructive) {
                Task { try? await authService.deleteAccount() }
            }
            Button("取消", role: .cancel) {}
        } message: {
            Text("此操作不可撤销，您的所有数据将被永久删除。")
        }
        .onChange(of: authService.isLoggedIn) { _, isLoggedIn in
            if isLoggedIn {
                currentView = .main
            }
        }
    }
    
    // MARK: - Main View
    
    private var mainView: some View {
        VStack(spacing: 0) {
            // 快捷搜索按钮
            Button(action: {
                QuickSearchWindow.shared.toggleWindow()
            }) {
                HStack(spacing: 10) {
                    Image(systemName: "sparkle.magnifyingglass")
                        .font(.system(size: 16))
                        .foregroundColor(.accentColor)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("智能搜索")
                            .font(.system(size: 13, weight: .medium))
                        Text("从菜单打开")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
            }
            .buttonStyle(.borderless)
            
            Divider()
            
            // 用户信息 / 登录
            if let user = authService.currentUser {
                userInfoSection(user)
            } else {
                loginSection
            }
            
            Divider()
            
            // 设置操作
            VStack(spacing: 0) {
                settingsRow(icon: "gearshape", title: "设置", action: { currentView = .settings })
                Divider()
                settingsRow(icon: "questionmark.circle", title: "帮助", action: { openHelp() })
            }
            
            Divider()
            
            // 底部操作
            HStack(spacing: 12) {
                if authService.isLoggedIn {
                    Button("退出登录") {
                        Task { await authService.logout() }
                    }
                    .buttonStyle(.borderless)
                    .font(.system(size: 12))
                    
                    Button("注销账号") {
                        showDeleteConfirmation = true
                    }
                    .buttonStyle(.borderless)
                    .font(.system(size: 12))
                    .foregroundColor(.red)
                }
                
                Spacer()
                
                Button("退出应用") {
                    NSApp.terminate(nil)
                }
                .buttonStyle(.borderless)
                .font(.system(size: 12))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
        }
        .transition(.opacity)
    }
    
    // MARK: - Login View
    
    private var loginView: some View {
        VStack(spacing: 0) {
            // Header with back button
            HStack {
                Button(action: { currentView = .main }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14))
                }
                .buttonStyle(.borderless)
                
                Spacer()
                
                Text("登录")
                    .font(.system(size: 14, weight: .semibold))
                
                Spacer()
                
                Image(systemName: "chevron.left")
                    .font(.system(size: 14))
                    .opacity(0)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            
            Divider()
            
            // 登录表单（隐藏header，紧凑模式）
            LoginView(showHeader: false, compact: true, onSwitchToRegister: { currentView = .register })
                .environment(authService)
                .padding(12)
        }
        .transition(.opacity.combined(with: .move(edge: .leading)))
    }
    
    // MARK: - Register View
    
    private var registerView: some View {
        VStack(spacing: 0) {
            // Header with back button
            HStack {
                Button(action: { currentView = .login }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14))
                }
                .buttonStyle(.borderless)
                
                Spacer()
                
                Text("注册")
                    .font(.system(size: 14, weight: .semibold))
                
                Spacer()
                
                Image(systemName: "chevron.left")
                    .font(.system(size: 14))
                    .opacity(0)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            
            Divider()
            
            // 注册表单（隐藏header，紧凑模式）
            RegisterView(showHeader: false, compact: true, onSwitchToLogin: { currentView = .login })
                .environment(authService)
                .padding(12)
        }
        .transition(.opacity.combined(with: .move(edge: .trailing)))
    }
    
    // MARK: - Settings View
    
    private var settingsView: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: { currentView = .main }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14))
                }
                .buttonStyle(.borderless)
                
                Spacer()
                
                Text("设置")
                    .font(.system(size: 14, weight: .semibold))
                
                Spacer()
                
                Image(systemName: "chevron.left")
                    .font(.system(size: 14))
                    .opacity(0)
            }
            .padding()
            
            Divider()
            
            VStack(spacing: 16) {
                Text("设置页面开发中...")
                    .foregroundColor(.secondary)
                    .padding()
                
                Spacer()
            }
        }
        .transition(.opacity)
    }
    
    // MARK: - User Info Section
    
    private func userInfoSection(_ user: User) -> some View {
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
    
    // MARK: - Login Section
    
    private var loginSection: some View {
        Button(action: { currentView = .login }) {
            HStack(spacing: 10) {
                Image(systemName: "person.badge.plus")
                    .font(.system(size: 16))
                    .foregroundColor(.accentColor)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("登录同步")
                        .font(.system(size: 13, weight: .medium))
                    Text("多设备数据同步")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
        .buttonStyle(.borderless)
    }
    
    // MARK: - Settings Row
    
    private func settingsRow(icon: String, title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                
                Text(title)
                    .font(.system(size: 13))
                
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
        }
        .buttonStyle(.borderless)
    }
    
    // MARK: - Actions
    
    private func openHelp() {
        NSWorkspace.shared.open(URL(string: "https://github.com/nexus-tools")!)
    }
}

#Preview {
    MenuBarSettingsView()
        .environment(AuthService.shared)
}