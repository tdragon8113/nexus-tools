import SwiftUI

/// 认证容器视图 - 切换登录/注册
struct AuthView: View {
    @State private var isLoginMode = true

    var body: some View {
        VStack {
            if isLoginMode {
                LoginView(onSwitchToRegister: { isLoginMode = false })
            } else {
                RegisterView(onSwitchToLogin: { isLoginMode = true })
            }
        }
    }
}

#Preview {
    AuthView()
        .environment(AuthService.shared)
}