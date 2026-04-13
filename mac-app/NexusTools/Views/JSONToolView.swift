import SwiftUI

/// JSON 工具视图 - 单框简洁设计
struct JSONToolView: View {
    var initialInput: String = ""
    @State private var content: String = ""
    @State private var errorMessage: String?
    @State private var successMessage: String?
    @State private var hasProcessedInitialInput = false
    
    var body: some View {
        VStack(spacing: 12) {
            // 单一编辑框
            TextEditor(text: $content)
                .font(.system(size: 13))
                .frame(maxWidth: .infinity)
                .frame(height: 280)
                .border(Color.secondary.opacity(0.3), width: 1)
                .cornerRadius(6)
                .overlay(
                    Group {
                        if content.isEmpty {
                            Text("输入 JSON 内容...")
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                                .padding(8)
                        }
                    },
                    alignment: .topLeading
                )
            
            // 消息提示
            if let error = errorMessage {
                HStack(spacing: 4) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.red)
                    Text(error)
                        .font(.system(size: 12))
                        .foregroundColor(.red)
                }
                .padding(.horizontal, 8)
            } else if let success = successMessage {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text(success)
                        .font(.system(size: 12))
                        .foregroundColor(.green)
                }
                .padding(.horizontal, 8)
            }
            
            // 操作按钮
            HStack(spacing: 8) {
                Button(action: formatJSON) {
                    Label("格式化", systemImage: "text.alignleft")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                
                Button(action: minifyJSON) {
                    Label("压缩", systemImage: "text.justify")
                }
                .buttonStyle(.bordered)
                
                Button(action: copyContent) {
                    Label("复制", systemImage: "doc.on.doc")
                }
                .buttonStyle(.bordered)
                .disabled(content.isEmpty)
                
                Button(action: clearAll) {
                    Label("清空", systemImage: "trash")
                }
                .buttonStyle(.bordered)
                .disabled(content.isEmpty)
            }
        }
        .padding(16)
        .onAppear {
            if !initialInput.isEmpty && !hasProcessedInitialInput {
                content = initialInput
                hasProcessedInitialInput = true
                formatJSON()
            }
        }
    }
    
    // MARK: - Actions
    
    private func formatJSON() {
        clearMessages()
        
        guard !content.isEmpty else {
            errorMessage = "请输入内容"
            return
        }
        
        guard let data = content.data(using: .utf8) else {
            errorMessage = "无法解析输入"
            return
        }
        
        do {
            let json = try JSONSerialization.jsonObject(with: data)
            let formattedData = try JSONSerialization.data(withJSONObject: json, options: [.prettyPrinted, .sortedKeys])
            content = String(data: formattedData, encoding: .utf8) ?? ""
            successMessage = "格式化成功"
        } catch {
            errorMessage = "JSON 错误: \(error.localizedDescription)"
        }
    }
    
    private func minifyJSON() {
        clearMessages()
        
        guard !content.isEmpty else {
            errorMessage = "请输入内容"
            return
        }
        
        guard let data = content.data(using: .utf8) else {
            errorMessage = "无法解析输入"
            return
        }
        
        do {
            let json = try JSONSerialization.jsonObject(with: data)
            let minifiedData = try JSONSerialization.data(withJSONObject: json, options: [])
            content = String(data: minifiedData, encoding: .utf8) ?? ""
            successMessage = "压缩成功"
        } catch {
            errorMessage = "JSON 错误: \(error.localizedDescription)"
        }
    }
    
    private func copyContent() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(content, forType: .string)
        successMessage = "已复制"
        
        // 2秒后清除提示
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            if successMessage == "已复制" {
                successMessage = nil
            }
        }
    }
    
    private func clearAll() {
        content = ""
        clearMessages()
    }
    
    private func clearMessages() {
        errorMessage = nil
        successMessage = nil
    }
}

#Preview {
    JSONToolView()
        .frame(width: 400, height: 380)
}