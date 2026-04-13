import SwiftUI

/// 工具列表行视图
struct ToolRow: View {
    let tool: ToolItem

    var body: some View {
        HStack(spacing: 12) {
            iconView
            nameView
            Spacer()
            shortcutBadge
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(rowBackground)
    }

    private var iconView: some View {
        Image(systemName: tool.icon)
            .font(.system(size: 20))
            .foregroundColor(.accentColor)
            .frame(width: 32)
    }

    private var nameView: some View {
        Text(tool.name)
            .font(.system(size: 14, weight: .medium))
    }

    private var shortcutBadge: some View {
        Text(tool.shortcut)
            .font(.system(size: 12))
            .foregroundColor(.secondary)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color(nsColor: .controlBackgroundColor))
            .cornerRadius(4)
    }

    private var rowBackground: some View {
        RoundedRectangle(cornerRadius: 6)
            .fill(Color.clear)
    }
}

#Preview {
    ToolRow(tool: ToolItem(type: .json))
        .padding()
}