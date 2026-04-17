import SwiftUI

/// 带预填充输入的工具详情视图
struct ToolDetailViewWithInput: View {
    let tool: ToolItem
    let initialInput: String
    var onClose: (() -> Void)? = nil

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

            Button(action: { closeWindow() }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.borderless)
            .help("关闭窗口")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
    
    // MARK: - Actions
    
    private func closeWindow() {
        if let onClose = onClose {
            onClose()
        } else {
            NSApp.keyWindow?.close()
        }
    }

    // MARK: - Tool Content

    @ViewBuilder
    private var toolContent: some View {
        switch tool.type {
        case .json:
            JSONToolView(initialInput: initialInput)
        case .base64:
            Base64ToolView(initialInput: initialInput)
        case .hash:
            HashToolView(initialInput: initialInput)
        case .url:
            URLToolView(initialInput: initialInput)
        case .timestamp:
            TimestampToolView(initialInput: initialInput)
        case .qrcode:
            QRCodeToolView(initialInput: initialInput)
        case .jwt:
            JWTToolView(initialInput: initialInput)
        case .clipboard:
            ClipboardHistoryView()
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