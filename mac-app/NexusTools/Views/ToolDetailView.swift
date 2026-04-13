import SwiftUI

/// 工具详情容器视图 - Sheet 弹窗形式
struct ToolDetailView: View {
    let tool: ToolItem
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            // 标题栏
            headerView
            Divider()
            // 工具内容
            toolContent
        }
        .frame(width: 400, height: 500)
    }

    // MARK: - Header

    private var headerView: some View {
        HStack(spacing: 12) {
            Image(systemName: tool.icon)
                .font(.system(size: 20))
                .foregroundColor(.accentColor)

            Text(tool.name)
                .font(.system(size: 16, weight: .semibold))

            Spacer()

            Button(action: { dismiss() }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.borderless)
            .keyboardShortcut(.escape, modifiers: [])
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    // MARK: - Tool Content

    @ViewBuilder
    private var toolContent: some View {
        switch tool.type {
        case .json:
            JSONToolView()
        case .base64:
            Base64ToolView()
        case .hash:
            HashToolView()
        case .url:
            URLToolView()
        case .timestamp:
            TimestampToolView()
        case .qrcode:
            QRCodeToolView()
        case .jwt:
            JWTToolView()
        case .clipboard:
            ClipboardHistoryView()
        // 未实现的工具显示占位符
        case .regex, .markdown, .todo, .timeTracker:
            placeholderView
        }
    }

    private var placeholderView: some View {
        VStack(spacing: 16) {
            Image(systemName: "hammer")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text("功能开发中")
                .font(.system(size: 16, weight: .medium))
            Text("此工具即将推出")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Preview

#Preview {
    ToolDetailView(tool: ToolItem(type: .json))
}