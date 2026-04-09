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
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "person.badge.plus")
                    .font(.system(size: 48))
                    .foregroundColor(.accentColor)
                Text("注册")
                    .font(.title2)
                    .fontWeight(.semibold)
            }
            .padding(.bottom, 10)

            // Form
            VStack(spacing: 16) {
                TextField("用户名", text: $username)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.username)

                TextField("邮箱", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.emailAddress)
            #if os(iOS)
                    .textInputAutocapitalization(.never)
            #endif

                SecureField("密码", text: $password)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.newPassword)

                SecureField("确认密码", text: $confirmPassword)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.newPassword)
            }

            // Error Message
            if let error = authService.errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }

            // Password Mismatch Warning
            if !password.isEmpty && !confirmPassword.isEmpty && password != confirmPassword {
                Text("两次密码不一致")
                    .foregroundColor(.orange)
                    .font(.caption)
            }

            // Register Button
            Button(action: register) {
                if authService.isLoading {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Text("注册")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(!isFormValid || authService.isLoading)

            // Switch to Login
            HStack(spacing: 4) {
                Text("已有账号？")
                    .foregroundColor(.secondary)
                Button("登录") {
                    onSwitchToLogin()
                }
                .buttonStyle(.plain)
                .foregroundColor(.accentColor)
            }
        }
        .padding(24)
        .frame(width: 300)
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