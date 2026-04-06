import SwiftUI

/// 主视图 - 应用主界面
struct MainView: View {
    @State private var selectedTool: ToolItem?

    var body: some View {
        NavigationSplitView {
            sidebar
        } detail: {
            detailView
        }
        .frame(minWidth: 800, minHeight: 600)
    }

    private var sidebar: some View {
        List(selection: $selectedTool) {
            Section("开发工具") {
                Label("JSON 工具", systemImage: "doc.text")
                Label("Base64", systemImage: "key")
                Label("Hash", systemImage: "hash")
            }
            Section("效率工具") {
                Label("待办事项", systemImage: "checklist")
                Label("时间追踪", systemImage: "clock")
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("Nexus Tools")
    }

    @ViewBuilder
    private var detailView: some View {
        if let tool = selectedTool {
            Text("工具: \(tool.name)")
                .font(.title)
                .navigationTitle(tool.name)
        } else {
            welcomeView
        }
    }

    private var welcomeView: some View {
        VStack(spacing: 20) {
            Image(systemName: "toolbox")
                .font(.system(size: 64))
                .foregroundColor(.accentColor)
            Text("Nexus Tools")
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("开发者工具箱")
                .font(.title3)
                .foregroundColor(.secondary)
            Text("选择左侧工具开始使用")
                .font(.body)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    MainView()
}