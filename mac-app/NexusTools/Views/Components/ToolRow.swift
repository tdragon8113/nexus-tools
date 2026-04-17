import SwiftUI

/// 工具列表行视图
struct ToolRow: View {
    let tool: ToolItem

    var body: some View {
        HStack(spacing: 12) {
            iconView
            nameView
            Spacer()
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

    private var rowBackground: some View {
        RoundedRectangle(cornerRadius: 6)
            .fill(Color.clear)
    }
}

#Preview {
    ToolRow(tool: ToolItem(type: .json))
        .padding()
}