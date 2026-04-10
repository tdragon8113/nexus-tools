import SwiftUI

/// 个人中心视图
struct ProfileView: View {
    @Environment(AuthService.self) private var authService
    @Environment(\.dismiss) private var dismiss

    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Text("个人中心")
                    .font(.system(size: 14, weight: .semibold))
                Spacer()
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.borderless)
            }
            
            Divider()
            
            if let user = authService.currentUser {
                // User Info
                VStack(spacing: 12) {
                    // Avatar
                    if let avatarUrl = user.avatarUrl, !avatarUrl.isEmpty {
                        AsyncImage(url: URL(string: avatarUrl)) { image in
                            image.resizable()
                        } placeholder: {
                            avatarPlaceholder
                        }
                        .frame(width: 64, height: 64)
                        .clipShape(Circle())
                    } else {
                        avatarPlaceholder
                    }

                    // Username
                    Text(user.username)
                        .font(.system(size: 15, weight: .medium))

                    // Email
                    Text(user.email)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)

                    // Nickname
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
                ProgressView("加载中...")
            }

            Spacer()
        }
        .padding()
        .frame(width: 280, height: 360)
        .confirmationDialog("确定要注销账号吗？", isPresented: $showDeleteConfirmation) {
            Button("注销账号", role: .destructive) {
                deleteAccount()
            }
            Button("取消", role: .cancel) {}
        } message: {
            Text("此操作不可撤销，您的所有数据将被永久删除。")
        }
    }

    private var avatarPlaceholder: some View {
        Image(systemName: "person.circle.fill")
            .font(.system(size: 64))
            .foregroundColor(.accentColor)
    }

    private func logout() {
        Task {
            await authService.logout()
            dismiss()
        }
    }

    private func deleteAccount() {
        isDeleting = true
        Task {
            do {
                try await authService.deleteAccount()
                dismiss()
            } catch {
                Logger.error("Delete account failed: \(error)")
            }
            isDeleting = false
        }
    }
}

#Preview {
    ProfileView()
        .environment(AuthService.shared)
}