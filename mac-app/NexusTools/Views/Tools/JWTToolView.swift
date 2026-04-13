import SwiftUI

/// JWT 解析工具视图
struct JWTToolView: View {
    @State private var input: String = ""
    @State private var headerOutput: String = ""
    @State private var payloadOutput: String = ""
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 12) {
            // 输入区
            inputSection

            // 操作按钮
            actionButtons

            // 输出区
            outputSection
        }
        .padding(16)
    }

    // MARK: - Input Section

    private var inputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("JWT Token")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
            TextEditor(text: $input)
                .font(.system(size: 13))
                .frame(height: 80)
                .border(Color.secondary.opacity(0.3), width: 1)
                .cornerRadius(4)
        }
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button(action: parseJWT) {
                Text("解析 JWT")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)

            Button(action: copyPayload) {
                Label("复制 Payload", systemImage: "doc.on.doc")
            }
            .buttonStyle(.bordered)
            .disabled(payloadOutput.isEmpty)

            Button(action: clearAll) {
                Label("清空", systemImage: "trash")
            }
            .buttonStyle(.bordered)
        }
    }

    // MARK: - Output Section

    private var outputSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red)
                    .padding(8)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(4)
            } else {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Header")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                    ScrollView {
                        Text(headerOutput)
                            .font(.system(size: 12))
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                    }
                    .frame(maxHeight: 80)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
                }

                // Payload
                VStack(alignment: .leading, spacing: 4) {
                    Text("Payload")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                    ScrollView {
                        Text(payloadOutput)
                            .font(.system(size: 12))
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                    }
                    .frame(maxHeight: 120)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
                }

                // 签名提示
                HStack {
                    Image(systemName: "info.circle")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                    Text("签名部分无法解析，仅验证完整性")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    // MARK: - Actions

    private func parseJWT() {
        errorMessage = nil
        headerOutput = ""
        payloadOutput = ""

        let trimmedInput = input.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedInput.isEmpty else {
            errorMessage = "请输入 JWT Token"
            return
        }

        // JWT 格式: header.payload.signature
        let parts = trimmedInput.split(separator: ".")

        guard parts.count == 3 else {
            errorMessage = "无效的 JWT 格式，应为三段结构 (header.payload.signature)"
            return
        }

        // 解析 Header
        if let headerData = decodeBase64(String(parts[0])),
           let headerJson = try? JSONSerialization.jsonObject(with: headerData) {
            headerOutput = formatJSON(headerJson)
        } else {
            errorMessage = "无法解析 Header 部分"
            return
        }

        // 解析 Payload
        if let payloadData = decodeBase64(String(parts[1])),
           let payloadJson = try? JSONSerialization.jsonObject(with: payloadData) {
            payloadOutput = formatJSON(payloadJson)
        } else {
            errorMessage = "无法解析 Payload 部分"
            return
        }
    }

    private func decodeBase64(_ base64: String) -> Data? {
        // JWT 使用 Base64URL 编码，需要转换为标准 Base64
        var base64String = base64
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        // 补齐 padding
        while base64String.count % 4 != 0 {
            base64String += "="
        }

        return Data(base64Encoded: base64String)
    }

    private func formatJSON(_ json: Any) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: json, options: [.prettyPrinted, .sortedKeys]) else {
            return ""
        }
        return String(data: data, encoding: .utf8) ?? ""
    }

    private func copyPayload() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(payloadOutput, forType: .string)
    }

    private func clearAll() {
        input = ""
        headerOutput = ""
        payloadOutput = ""
        errorMessage = nil
    }
}

#Preview {
    JWTToolView()
        .frame(width: 400, height: 500)
}