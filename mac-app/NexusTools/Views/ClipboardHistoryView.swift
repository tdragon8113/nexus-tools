import SwiftUI

/// 剪贴板历史工具视图
struct ClipboardHistoryView: View {
    @State private var history: [ClipboardItem] = []
    @State private var maxItems: Int = 50

    struct ClipboardItem: Identifiable {
        let id = UUID()
        let content: String
        let timestamp: Date
        let type: ItemType

        enum ItemType {
            case text
            case url
            case code
        }
    }

    var body: some View {
        VStack(spacing: 12) {
            currentClipboardSection
            Divider()
            historySection
        }
        .padding(16)
        .onAppear { loadCurrentClipboard() }
    }

    private var currentClipboardSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("当前剪贴板")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)

                Spacer()

                Button(action: addToHistory) {
                    Label("保存到历史", systemImage: "plus.circle")
                        .font(.system(size: 11))
                }
                .buttonStyle(.bordered)
            }

            if let content = NSPasteboard.general.string(forType: .string) {
                Text(content)
                    .font(.system(size: 12))
                    .lineLimit(3)
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
            } else {
                Text("剪贴板为空或包含非文本内容")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                    .padding(8)
                    .frame(maxWidth: .infinity)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
            }
        }
    }

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("历史记录")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)

                Spacer()

                Text("\(history.count)/\(maxItems)")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)

                Button(action: clearHistory) {
                    Image(systemName: "trash")
                        .font(.system(size: 12))
                }
                .buttonStyle(.borderless)
                .disabled(history.isEmpty)
            }

            if history.isEmpty {
                Text("无历史记录")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
            } else {
                ScrollView {
                    LazyVStack(spacing: 6) {
                        ForEach(history) { item in
                            historyItemRow(item)
                        }
                    }
                }
                .frame(maxHeight: 280)
            }
        }
    }

    private func historyItemRow(_ item: ClipboardItem) -> some View {
        HStack(spacing: 8) {
            Image(systemName: iconForType(item.type))
                .font(.system(size: 12))
                .foregroundColor(.accentColor)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text(item.content)
                    .font(.system(size: 12))
                    .lineLimit(2)
                    .truncationMode(.tail)

                Text(formatTime(item.timestamp))
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: { copyToClipboard(item.content) }) {
                Image(systemName: "doc.on.doc")
                    .font(.system(size: 12))
            }
            .buttonStyle(.borderless)

            Button(action: { removeFromHistory(item) }) {
                Image(systemName: "xmark.circle")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.borderless)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(4)
    }

    private func iconForType(_ type: ClipboardItem.ItemType) -> String {
        switch type {
        case .text: return "text.alignleft"
        case .url: return "link"
        case .code: return "chevron.left.forwardslash.chevron.right"
        }
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        if date.timeIntervalSinceNow > -3600 {
            formatter.dateFormat = "刚刚"
        } else if date.timeIntervalSinceNow > -86400 {
            formatter.dateFormat = "HH:mm"
        } else {
            formatter.dateFormat = "MM-dd HH:mm"
        }
        return formatter.string(from: date)
    }

    private func loadCurrentClipboard() {
        // 实际应用中可以从持久化存储加载历史
    }

    private func addToHistory() {
        guard let content = NSPasteboard.general.string(forType: .string),
              !content.isEmpty else { return }

        let type: ClipboardItem.ItemType
        if content.hasPrefix("http://") || content.hasPrefix("https://") {
            type = .url
        } else if content.contains("{") || content.contains("func") || content.contains("class") {
            type = .code
        } else {
            type = .text
        }

        let item = ClipboardItem(content: content, timestamp: Date(), type: type)

        if history.count >= maxItems {
            history.removeLast()
        }
        history.insert(item, at: 0)
    }

    private func copyToClipboard(_ content: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(content, forType: .string)
    }

    private func removeFromHistory(_ item: ClipboardItem) {
        history.removeAll { $0.id == item.id }
    }

    private func clearHistory() {
        history.removeAll()
    }
}

#Preview {
    ClipboardHistoryView()
        .frame(width: 400, height: 500)
}