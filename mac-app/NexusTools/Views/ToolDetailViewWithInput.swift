import SwiftUI
import AppKit

/// 带预填充输入的工具详情视图
struct ToolDetailViewWithInput: View {
    let tool: ToolItem
    let initialInput: String
    var onClose: (() -> Void)? = nil
    /// JSON 工具：标题栏文档图标切换双栏对比
    @State private var jsonCompareMode = false

    var body: some View {
        VStack(spacing: 0) {
            // 标题栏
            headerView
            Divider()
            // 工具内容：占满剩余高度并顶部对齐，避免上下大块留白
            toolContent
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .frame(minWidth: 360, maxWidth: .infinity, minHeight: 440, idealHeight: 440, maxHeight: .infinity)
        .background(Color(nsColor: .windowBackgroundColor))
        // 双栏对比时加宽工具面板（保持窗口左边不动，向右延伸）
        .background(ToolWindowWidthForJSONCompare(widen: tool.type == .json && jsonCompareMode))
    }

    // MARK: - Header

    private var headerView: some View {
        HStack(spacing: 10) {
            Button(action: goBack) {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 11, weight: .semibold))
                    Text("返回")
                        .font(.system(size: 13, weight: .medium))
                }
                .foregroundColor(.accentColor)
            }
            .buttonStyle(.plain)
            .help("返回快捷搜索")

            Group {
                if tool.type == .json {
                    Button {
                        jsonCompareMode.toggle()
                    } label: {
                        Image(systemName: tool.icon)
                            .font(.system(size: 18))
                            .foregroundColor(.accentColor)
                    }
                    .buttonStyle(.plain)
                    .help(jsonCompareMode ? "退出双栏对比" : "JSON 双栏对比")
                } else {
                    Image(systemName: tool.icon)
                        .font(.system(size: 18))
                        .foregroundColor(.accentColor)
                }
            }

            Spacer(minLength: 12)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
    }
    
    // MARK: - Actions

    /// 关闭工具窗口并回到快捷搜索
    private func goBack() {
        closeWindow()
        DispatchQueue.main.async {
            QuickSearchWindow.shared.showWindow()
        }
    }
    
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
            JSONToolView(initialInput: initialInput, isCompareMode: $jsonCompareMode)
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

// MARK: - JSON 对比时加宽宿主 NSPanel

/// 贴在根视图背后，根据 `widen` 调整 `window.frame`（不依赖 keyWindow，避免多面板误判）
private struct ToolWindowWidthForJSONCompare: NSViewRepresentable {
    var widen: Bool

    func makeNSView(context: Context) -> NSView {
        NSView()
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        DispatchQueue.main.async {
            guard let win = nsView.window else { return }
            var frame = win.frame
            let target: CGFloat = widen ? max(780, frame.width) : 400
            guard abs(frame.width - target) > 1.5 else { return }
            frame.size.width = target
            win.setFrame(frame, display: true, animate: true)
        }
    }
}