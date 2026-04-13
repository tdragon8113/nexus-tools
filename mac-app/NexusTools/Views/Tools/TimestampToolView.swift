import SwiftUI

/// 时间戳转换工具视图
struct TimestampToolView: View {
    @State private var timestampInput: String = ""
    @State private var dateInput: String = ""
    @State private var output: String = ""
    @State private var errorMessage: String?
    @State private var currentTimestamp: String = ""

    private let dateFormatter = DateFormatter()
    private let isoFormatter = ISO8601DateFormatter()

    init() {
        // 配置日期格式
        dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        dateFormatter.locale = Locale(identifier: "zh_CN")
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    }

    var body: some View {
        VStack(spacing: 12) {
            // 当前时间戳
            currentTimestampSection

            Divider()

            // 时间戳转日期
            timestampToDateSection

            Divider()

            // 日期转时间戳
            dateToTimestampSection

            Divider()

            // 输出区
            outputSection
        }
        .padding(16)
        .onAppear { updateCurrentTimestamp() }
    }

    // MARK: - Current Timestamp

    private var currentTimestampSection: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("当前时间戳")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                Text(currentTimestamp)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.accentColor)
            }

            Spacer()

            Button(action: { copyTimestamp(currentTimestamp) }) {
                Image(systemName: "doc.on.doc")
            }
            .buttonStyle(.borderless)

            Button(action: { timestampInput = currentTimestamp }) {
                Text("使用")
                    .font(.system(size: 11))
            }
            .buttonStyle(.bordered)
        }
        .padding(8)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(4)
    }

    // MARK: - Timestamp to Date

    private var timestampToDateSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("时间戳 → 日期")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                TextField("输入时间戳 (秒或毫秒)", text: $timestampInput)
                    .textFieldStyle(.roundedBorder)
                    .font(.system(size: 13))

                Button(action: convertTimestampToDate) {
                    Text("转换")
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    // MARK: - Date to Timestamp

    private var dateToTimestampSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("日期 → 时间戳")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                TextField("输入日期 (yyyy-MM-dd HH:mm:ss)", text: $dateInput)
                    .textFieldStyle(.roundedBorder)
                    .font(.system(size: 13))

                Button(action: convertDateToTimestamp) {
                    Text("转换")
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    // MARK: - Output Section

    private var outputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("结果")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red)
                    .padding(8)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(4)
            } else if output.isEmpty {
                Text("请输入时间戳或日期进行转换")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
            } else {
                ScrollView {
                    Text(output)
                        .font(.system(size: 13))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                }
                .frame(maxHeight: 120)
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(4)

                HStack {
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
        }
    }

    // MARK: - Actions

    private func updateCurrentTimestamp() {
        let now = Date()
        let seconds = Int(now.timeIntervalSince1970)
        currentTimestamp = String(seconds)
    }

    private func convertTimestampToDate() {
        errorMessage = nil
        output = ""

        guard let timestamp = Double(timestampInput.trimmingCharacters(in: .whitespaces)) else {
            errorMessage = "无效的时间戳格式"
            return
        }

        // 判断是秒还是毫秒
        let date: Date
        if timestamp > 1_000_000_000_000 { // 毫秒
            date = Date(timeIntervalSince1970: timestamp / 1000)
        } else { // 秒
            date = Date(timeIntervalSince1970: timestamp)
        }

        // 生成多种格式的输出
        var results: [String] = []
        results.append("格式化时间: " + dateFormatter.string(from: date))
        results.append("ISO 8601: " + isoFormatter.string(from: date))

        // 其他格式
        let relativeFormatter = RelativeDateTimeFormatter()
        relativeFormatter.unitsStyle = .full
        results.append("相对时间: " + relativeFormatter.localizedString(for: date, relativeTo: Date()))

        // 星期几
        let weekdayFormatter = DateFormatter()
        weekdayFormatter.dateFormat = "EEEE"
        weekdayFormatter.locale = Locale(identifier: "zh_CN")
        results.append("星期: " + weekdayFormatter.string(from: date))

        output = results.joined(separator: "\n")
    }

    private func convertDateToTimestamp() {
        errorMessage = nil
        output = ""

        let trimmedInput = dateInput.trimmingCharacters(in: .whitespaces)

        // 尝试解析日期
        var date: Date?

        // 尝试标准格式
        date = dateFormatter.date(from: trimmedInput)

        // 尝试 ISO 8601
        if date == nil {
            date = isoFormatter.date(from: trimmedInput)
        }

        // 尝试仅日期格式
        if date == nil {
            let onlyDateFormatter = DateFormatter()
            onlyDateFormatter.dateFormat = "yyyy-MM-dd"
            onlyDateFormatter.locale = Locale(identifier: "zh_CN")
            date = onlyDateFormatter.date(from: trimmedInput)
        }

        guard let parsedDate = date else {
            errorMessage = "无法解析日期，请使用 yyyy-MM-dd HH:mm:ss 格式"
            return
        }

        let seconds = Int(parsedDate.timeIntervalSince1970)
        let milliseconds = seconds * 1000

        var results: [String] = []
        results.append("秒级时间戳: \(seconds)")
        results.append("毫秒级时间戳: \(milliseconds)")

        output = results.joined(separator: "\n")
    }

    private func copyTimestamp(_ timestamp: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(timestamp, forType: .string)
    }

    private func copyOutput() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(output, forType: .string)
    }

    private func clearAll() {
        timestampInput = ""
        dateInput = ""
        output = ""
        errorMessage = nil
    }
}

#Preview {
    TimestampToolView()
        .frame(width: 400, height: 500)
}