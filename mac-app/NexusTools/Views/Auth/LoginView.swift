import SwiftUI

/// 登录视图
struct LoginView: View {
    @Environment(AuthService.self) private var authService
    
    @State private var username = ""
    @State private var password = ""
    
    var showHeader: Bool = true
    var compact: Bool = false  // 紧凑模式（用于菜单栏嵌入）
    var onSwitchToRegister: () -> Void
    
    var body: some View {
        VStack(spacing: compact ? 8 : 12) {
            // Header - 可隐藏（用于菜单栏嵌入）
            if showHeader {
                VStack(spacing: 6) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.accentColor)
                    
                    Text("Nexus Tools")
                        .font(.system(size: 16, weight: .semibold))
                }
                .padding(.bottom, 8)
            }
            
            // Form
            VStack(spacing: compact ? 8 : 10) {
                AuthInputField(
                    icon: "person",
                    placeholder: "用户名",
                    text: $username
                )
                
                AuthInputField(
                    icon: "lock",
                    placeholder: "密码",
                    text: $password,
                    isSecure: true
                )
            }
            
            // Error Message
            if let error = authService.errorMessage {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 10))
                    Text(error)
                        .font(.system(size: 11))
                }
                .foregroundColor(.red)
            }
            
            Spacer()
                .frame(height: compact ? 8 : 12)
            
            // Login Button
            Button(action: login) {
                HStack {
                    if authService.isLoading {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Text("登录")
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(username.isEmpty || password.isEmpty || authService.isLoading)
            
            Divider()
            
            // Switch to Register
            HStack(spacing: 4) {
                Text("还没有账号？")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                Button("注册") {
                    onSwitchToRegister()
                }
                .buttonStyle(.borderless)
                .font(.system(size: 12))
            }
        }
    }
    
    private func login() {
        Task {
            await authService.login(username: username, password: password)
        }
    }
}

#Preview {
    LoginView(onSwitchToRegister: {})
        .environment(AuthService.shared)
}