import SwiftUI

/// JSON 工具视图 - 格式化、压缩、校验
struct JSONToolView: View {
    @State private var input: String = ""
    @State private var output: String = ""
    @State private var errorMessage: String?
    @State private var mode: Mode = .format

    enum Mode: String, CaseIterable {
        case format = "格式化"
        case minify = "压缩"
        case validate = "校验"
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
            Text("输入")
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

            Button(action: clearAll) {
                Label("清空", systemImage: "trash")
            }
            .buttonStyle(.bordered)
        }
    }

    // MARK: - Output Section

    private var outputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("输出")
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
            errorMessage = "请输入 JSON 内容"
            return
        }

        switch mode {
        case .format:
            formatJSON()
        case .minify:
            minifyJSON()
        case .validate:
            validateJSON()
        }
    }

    private func formatJSON() {
        guard let data = input.data(using: .utf8) else {
            errorMessage = "无法解析输入"
            return
        }

        do {
            let json = try JSONSerialization.jsonObject(with: data)
            let formattedData = try JSONSerialization.data(withJSONObject: json, options: [.prettyPrinted, .sortedKeys])
            output = String(data: formattedData, encoding: .utf8) ?? ""
        } catch {
            errorMessage = "JSON 解析错误: \(error.localizedDescription)"
        }
    }

    private func minifyJSON() {
        guard let data = input.data(using: .utf8) else {
            errorMessage = "无法解析输入"
            return
        }

        do {
            let json = try JSONSerialization.jsonObject(with: data)
            let minifiedData = try JSONSerialization.data(withJSONObject: json, options: [])
            output = String(data: minifiedData, encoding: .utf8) ?? ""
        } catch {
            errorMessage = "JSON 解析错误: \(error.localizedDescription)"
        }
    }

    private func validateJSON() {
        guard let data = input.data(using: .utf8) else {
            errorMessage = "无法解析输入"
            return
        }

        do {
            let json = try JSONSerialization.jsonObject(with: data)
            output = "✓ JSON 格式正确\n\n类型: \(getTypeDescription(json))"
        } catch {
            errorMessage = "✗ JSON 格式错误: \(error.localizedDescription)"
        }
    }

    private func getTypeDescription(_ json: Any) -> String {
        if json is [String: Any] { return "对象 (Object)" }
        if json is [Any] { return "数组 (Array)" }
        if json is String { return "字符串 (String)" }
        if json is NSNumber { return "数字 (Number)" }
        if json is Bool { return "布尔值 (Boolean)" }
        if json is NSNull { return "空值 (Null)" }
        return "未知类型"
    }

    private func copyOutput() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(output, forType: .string)
    }

    private func clearAll() {
        input = ""
        output = ""
        errorMessage = nil
    }
}

#Preview {
    JSONToolView()
        .frame(width: 400, height: 500)
}