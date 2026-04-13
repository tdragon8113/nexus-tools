import SwiftUI

/// URL 编解码工具视图
struct URLToolView: View {
    @State private var input: String = ""
    @State private var output: String = ""
    @State private var errorMessage: String?
    @State private var mode: Mode = .encode

    enum Mode: String, CaseIterable {
        case encode = "编码"
        case decode = "解码"
    }

    var body: some View {
        VStack(spacing: 12) {
            // 模式选择
            modeSelector

            // 输入区
            inputSection

            // 操作按钮
            actionButtons

            // 输出区
            outputSection
        }
        .padding(16)
    }

    // MARK: - Mode Selector

    private var modeSelector: some View {
        HStack(spacing: 8) {
            ForEach(Mode.allCases, id: \.self) { m in
                Button(action: { mode = m }) {
                    Text(m.rawValue)
                        .font(.system(size: 12))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(mode == m ? Color.accentColor : Color.secondary.opacity(0.2))
                        .foregroundColor(mode == m ? .white : .primary)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                }
                .buttonStyle(.borderless)
            }
        }
    }

    // MARK: - Input Section

    private var inputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(mode == .encode ? "原始 URL/文本" : "编码后的 URL")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
            TextEditor(text: $input)
                .font(.system(size: 13))
                .frame(height: 120)
                .border(Color.secondary.opacity(0.3), width: 1)
                .cornerRadius(4)
        }
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button(action: process) {
                Text(mode.rawValue)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)

            Button(action: copyOutput) {
                Label("复制结果", systemImage: "doc.on.doc")
            }
            .buttonStyle(.bordered)
            .disabled(output.isEmpty)

            Button(action: swapInputOutput) {
                Label("交换", systemImage: "arrow.left.arrow.right")
            }
            .buttonStyle(.bordered)
            .disabled(output.isEmpty)

            Button(action: clearAll) {
                Label("清空", systemImage: "trash")
            }
            .buttonStyle(.bordered)
        }
    }

    // MARK: - Output Section

    private var outputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(mode == .encode ? "编码结果" : "解码结果")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(8)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(4)
            } else {
                TextEditor(text: .constant(output))
                    .font(.system(size: 13))
                    .frame(height: 120)
                    .border(Color.secondary.opacity(0.3), width: 1)
                    .cornerRadius(4)
            }
        }
    }

    // MARK: - Actions

    private func process() {
        errorMessage = nil
        output = ""

        guard !input.isEmpty else {
            errorMessage = "请输入内容"
            return
        }

        switch mode {
        case .encode:
            encodeURL()
        case .decode:
            decodeURL()
        }
    }

    private func encodeURL() {
        // 使用完整的 URL 编码（包含所有特殊字符）
        output = input.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? input
    }

    private func decodeURL() {
        output = input.removingPercentEncoding ?? input

        // 如果解码失败（输出和输入一样），提示用户
        if output == input && input.contains("%") {
            errorMessage = "部分内容无法解码，可能包含无效的百分号编码"
        }
    }

    private func copyOutput() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(output, forType: .string)
    }

    private func swapInputOutput() {
        input = output
        output = ""
        errorMessage = nil
        // 切换模式
        mode = mode == .encode ? .decode : .encode
    }

    private func clearAll() {
        input = ""
        output = ""
        errorMessage = nil
    }
}

#Preview {
    URLToolView()
        .frame(width: 400, height: 500)
}