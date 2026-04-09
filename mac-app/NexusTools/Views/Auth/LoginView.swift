import SwiftUI

/// 登录视图
struct LoginView: View {
    @Environment(AuthService.self) private var authService

    @State private var username = ""
    @State private var password = ""

    var onSwitchToRegister: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.accentColor)
                Text("登录")
                    .font(.title2)
                    .fontWeight(.semibold)
            }
            .padding(.bottom, 10)

            // Form
            VStack(spacing: 16) {
                TextField("用户名", text: $username)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.username)

                SecureField("密码", text: $password)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.password)
            }

            // Error Message
            if let error = authService.errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }

            // Login Button
            Button(action: login) {
                if authService.isLoading {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Text("登录")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(username.isEmpty || password.isEmpty || authService.isLoading)

            // Switch to Register
            HStack(spacing: 4) {
                Text("没有账号？")
                    .foregroundColor(.secondary)
                Button("注册") {
                    onSwitchToRegister()
                }
                .buttonStyle(.plain)
                .foregroundColor(.accentColor)
            }
        }
        .padding(24)
        .frame(width: 300)
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