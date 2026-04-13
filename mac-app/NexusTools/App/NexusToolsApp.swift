import SwiftUI

@main
struct NexusToolsApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var authService = AuthService.shared

    var body: some Scene {
        MenuBarExtra("Nexus Tools", systemImage: "wrench.and.screwdriver") {
            MenuBarSettingsView()
                .environment(authService)
        }
        .menuBarExtraStyle(.window)
        .windowStyle(.hiddenTitleBar)
    }
}