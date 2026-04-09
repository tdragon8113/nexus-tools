import SwiftUI

/// 个人中心视图
struct ProfileView: View {
    @Environment(AuthService.self) private var authService
    @Environment(\.dismiss) private var dismiss

    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false

    var body: some View {
        VStack(spacing: 24) {
            // Header
            HStack {
                Text("个人中心")
                    .font(.title2)
                    .fontWeight(.semibold)
                Spacer()
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }

            if let user = authService.currentUser {
                // User Info Card
                VStack(spacing: 16) {
                    // Avatar
                    if let avatarUrl = user.avatarUrl, !avatarUrl.isEmpty {
                        AsyncImage(url: URL(string: avatarUrl)) { image in
                            image.resizable()
                        } placeholder: {
                            avatarPlaceholder
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                    } else {
                        avatarPlaceholder
                    }

                    // Username
                    Text(user.username)
                        .font(.title3)
                        .fontWeight(.medium)

                    // Email
                    Text(user.email)
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    // Nickname (if exists)
                    if let nickname = user.nickname, !nickname.isEmpty {
                        Text(nickname)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color(nsColor: .controlBackgroundColor))
                .cornerRadius(12)

                // Actions
                VStack(spacing: 12) {
                    // Logout Button
                    Button(action: logout) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("退出登录")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)

                    // Delete Account Button
                    Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                        HStack {
                            Image(systemName: "trash")
                            Text("注销账号")
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
        .padding(24)
        .frame(width: 320, height: 400)
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
            .font(.system(size: 80))
            .foregroundColor(.gray)
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