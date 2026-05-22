cask "nexus-tools" do
  version "{{VERSION}}"
  sha256 "{{SHA256}}"

  url "https://github.com/tdragon8113/nexus-tools/releases/download/web-tools-v#{version}/NexusTools.dmg"
  name "Nexus Tools"
  desc "开发者工具箱（Electron 桌面版，Alt+Space 唤起）"
  homepage "https://github.com/tdragon8113/nexus-tools"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Nexus Tools.app"

  zap trash: [
    "~/Library/Application Support/Nexus Tools",
    "~/Library/Application Support/nexus-tools",
    "~/Library/Preferences/com.nexus.tools.plist",
    "~/Library/Saved Application State/com.nexus.tools.savedState",
  ]
end
