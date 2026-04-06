import Foundation
import os

/// 日志工具
enum Logger {
    private static let subsystem = Bundle.main.bundleIdentifier ?? "com.nexus.NexusTools"
    private static let logger = os.Logger(subsystem: subsystem, category: "App")

    // MARK: - Log Levels

    static func debug(_ message: String, file: String = #file, function: String = #function, line: Int = #line) {
        logger.debug("[\(fileName(from: file)):\(line)] \(function): \(message)")
    }

    static func info(_ message: String, file: String = #file, function: String = #function, line: Int = #line) {
        logger.info("[\(fileName(from: file)):\(line)] \(function): \(message)")
    }

    static func warning(_ message: String, file: String = #file, function: String = #function, line: Int = #line) {
        logger.warning("[\(fileName(from: file)):\(line)] \(function): \(message)")
    }

    static func error(_ message: String, file: String = #file, function: String = #function, line: Int = #line) {
        logger.error("[\(fileName(from: file)):\(line)] \(function): \(message)")
    }

    static func error(_ error: Error, file: String = #file, function: String = #function, line: Int = #line) {
        logger.error("[\(fileName(from: file)):\(line)] \(function): \(error.localizedDescription)")
    }

    // MARK: - Private Helpers

    private static func fileName(from path: String) -> String {
        URL(fileURLWithPath: path).lastPathComponent
    }
}