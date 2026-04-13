import SwiftUI
import CoreImage.CIFilterBuiltins

/// 二维码生成工具视图
struct QRCodeToolView: View {
    @State private var input: String = ""
    @State private var qrImage: NSImage?
    @State private var errorMessage: String?
    @State private var qrSize: CGFloat = 200

    private let context = CIContext()

    var body: some View {
        VStack(spacing: 12) {
            // 输入区
            inputSection

            // 大小选择
            sizeSelector

            // 操作按钮
            actionButtons

            // 输出区（二维码图片）
            outputSection
        }
        .padding(16)
    }

    // MARK: - Input Section

    private var inputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("输入内容")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
            TextEditor(text: $input)
                .font(.system(size: 13))
                .frame(height: 80)
                .border(Color.secondary.opacity(0.3), width: 1)
                .cornerRadius(4)
        }
    }

    // MARK: - Size Selector

    private var sizeSelector: some View {
        HStack(spacing: 12) {
            Text("大小:")
                .font(.system(size: 12))
                .foregroundColor(.secondary)

            Picker("", selection: $qrSize) {
                Text("小 (150px)").tag(CGFloat(150))
                Text("中 (200px)").tag(CGFloat(200))
                Text("大 (300px)").tag(CGFloat(300))
            }
            .pickerStyle(.segmented)
            .frame(width: 240)
        }
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button(action: generateQRCode) {
                Text("生成二维码")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)

            Button(action: copyQRCode) {
                Label("复制图片", systemImage: "doc.on.doc")
            }
            .buttonStyle(.bordered)
            .disabled(qrImage == nil)

            Button(action: saveQRCode) {
                Label("保存", systemImage: "square.and.arrow.down")
            }
            .buttonStyle(.bordered)
            .disabled(qrImage == nil)

            Button(action: clearAll) {
                Label("清空", systemImage: "trash")
            }
            .buttonStyle(.bordered)
        }
    }

    // MARK: - Output Section

    private var outputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("二维码")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(4)
            } else if let image = qrImage {
                Image(nsImage: image)
                    .resizable()
                    .interpolation(.high)
                    .frame(width: qrSize, height: qrSize)
                    .background(Color.white)
                    .cornerRadius(4)
            } else {
                Text("输入内容后点击生成按钮")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                    .frame(width: qrSize, height: qrSize)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Actions

    private func generateQRCode() {
        errorMessage = nil
        qrImage = nil

        guard !input.isEmpty else {
            errorMessage = "请输入内容"
            return
        }

        guard let data = input.data(using: .utf8) else {
            errorMessage = "无法转换输入为数据"
            return
        }

        let filter = CIFilter.qrCodeGenerator()
        filter.message = data
        filter.correctionLevel = "M" // 中等纠错级别

        guard let outputImage = filter.outputImage else {
            errorMessage = "无法生成二维码"
            return
        }

        // 缩放图片到指定大小
        let scaleX = qrSize / outputImage.extent.size.width
        let scaleY = qrSize / outputImage.extent.size.height
        let scaledImage = outputImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))

        // 转换为 NSImage
        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else {
            errorMessage = "无法创建图片"
            return
        }

        qrImage = NSImage(cgImage: cgImage, size: NSSize(width: qrSize, height: qrSize))
    }

    private func copyQRCode() {
        guard let image = qrImage else { return }
        NSPasteboard.general.clearContents()
        NSPasteboard.general.writeObjects([image])
    }

    private func saveQRCode() {
        guard let image = qrImage else { return }

        let savePanel = NSSavePanel()
        savePanel.allowedContentTypes = [.png]
        savePanel.nameFieldStringValue = "qrcode.png"

        savePanel.begin { response in
            if response == .OK, let url = savePanel.url {
                if let tiffData = image.tiffRepresentation,
                   let bitmap = NSBitmapImageRep(data: tiffData),
                   let pngData = bitmap.representation(using: .png, properties: [:]) {
                    try? pngData.write(to: url)
                }
            }
        }
    }

    private func clearAll() {
        input = ""
        qrImage = nil
        errorMessage = nil
    }
}

#Preview {
    QRCodeToolView()
        .frame(width: 400, height: 500)
}