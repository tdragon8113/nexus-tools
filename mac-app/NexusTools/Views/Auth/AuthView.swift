import SwiftUI

/// 认证容器视图 - 切换登录/注册
struct AuthView: View {
    @Environment(AuthService.self) private var authService
    var onBack: () -> Void
    @State private var isLoginMode = true

    var body: some View {
        VStack(spacing: 0) {
            // Back button and title
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14))
                }
                .buttonStyle(.borderless)
                
                Spacer()
                
                Text(isLoginMode ? "登录" : "注册")
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
                VStack(spacing: 12) {
                    if isLoginMode {
                        LoginView(onSwitchToRegister: { 
                            withAnimation(.easeInOut(duration: 0.2)) {
                                isLoginMode = false 
                            }
                        })
                    } else {
                        RegisterView(onSwitchToLogin: { 
                            withAnimation(.easeInOut(duration: 0.2)) {
                                isLoginMode = true 
                            }
                        })
                    }
                }
                .padding()
            }
        }
        .onChange(of: authService.isLoggedIn) { _, isLoggedIn in
            if isLoggedIn {
                onBack()
            }
        }
    }
}

// MARK: - 输入框组件

struct AuthInputField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .frame(width: 16)
            
            if isSecure {
                SecureField(placeholder, text: $text)
                    .textFieldStyle(.roundedBorder)
            } else {
                TextField(placeholder, text: $text)
                    .textFieldStyle(.roundedBorder)
            }
        }
    }
}

#Preview {
    AuthView(onBack: {})
        .environment(AuthService.shared)
}