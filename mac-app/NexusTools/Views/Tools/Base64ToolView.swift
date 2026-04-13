import SwiftUI

/// Base64 编解码工具视图
struct Base64ToolView: View {
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
            Text(mode == .encode ? "原始文本" : "Base64 文本")
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
            Text(mode == .encode ? "Base64 结果" : "解码结果")
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
            encodeBase64()
        case .decode:
            decodeBase64()
        }
    }

    private func encodeBase64() {
        guard let data = input.data(using: .utf8) else {
            errorMessage = "无法转换为 UTF-8 数据"
            return
        }
        output = data.base64EncodedString()
    }

    private func decodeBase64() {
        // 清理输入（去除可能的空白和换行）
        let cleanedInput = input.trimmingCharacters(in: .whitespacesAndNewlines)

        guard let data = Data(base64Encoded: cleanedInput) else {
            errorMessage = "无效的 Base64 字符串"
            return
        }

        guard let decodedString = String(data: data, encoding: .utf8) else {
            // 如果不是 UTF-8，尝试其他编码或显示原始字节
            errorMessage = "解码成功，但不是有效的 UTF-8 文本。原始数据: \(data.count) 字节"
            output = data.map { String(format: "%02X", $0) }.joined(separator: " ")
            return
        }

        output = decodedString
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
    Base64ToolView()
        .frame(width: 400, height: 500)
}