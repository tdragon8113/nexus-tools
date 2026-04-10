import SwiftUI

/// 注册视图
struct RegisterView: View {
    @Environment(AuthService.self) private var authService
    
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    
    var onSwitchToLogin: () -> Void
    
    var body: some View {
        VStack(spacing: 10) {
            // Header
            VStack(spacing: 6) {
                Image(systemName: "person.badge.plus")
                    .font(.system(size: 40))
                    .foregroundColor(.green)
                
                Text("创建账号")
                    .font(.system(size: 16, weight: .semibold))
            }
            .padding(.bottom, 4)
            
            // Form
            VStack(spacing: 8) {
                AuthInputField(
                    icon: "person",
                    placeholder: "用户名 (3-50字符)",
                    text: $username
                )
                
                AuthInputField(
                    icon: "envelope",
                    placeholder: "邮箱",
                    text: $email
                )
                
                AuthInputField(
                    icon: "lock",
                    placeholder: "密码 (至少6位)",
                    text: $password,
                    isSecure: true
                )
                
                AuthInputField(
                    icon: "lock.rotation",
                    placeholder: "确认密码",
                    text: $confirmPassword,
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
            
            // Password Mismatch Warning
            if !password.isEmpty && !confirmPassword.isEmpty && password != confirmPassword {
                HStack(spacing: 4) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 10))
                    Text("两次密码不一致")
                        .font(.system(size: 11))
                }
                .foregroundColor(.orange)
            }
            
            // Register Button
            Button(action: register) {
                HStack {
                    if authService.isLoading {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Text("注册")
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(!isFormValid || authService.isLoading)
            
            Divider()
            
            // Switch to Login
            HStack(spacing: 4) {
                Text("已有账号？")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                Button("登录") {
                    onSwitchToLogin()
                }
                .buttonStyle(.borderless)
                .font(.system(size: 12))
            }
        }
    }
    
    private var isFormValid: Bool {
        !username.isEmpty &&
        !email.isEmpty &&
        !password.isEmpty &&
        password == confirmPassword
    }
    
    private func register() {
        Task {
            await authService.register(username: username, email: email, password: password)
        }
    }
}

#Preview {
    RegisterView(onSwitchToLogin: {})
        .environment(AuthService.shared)
}