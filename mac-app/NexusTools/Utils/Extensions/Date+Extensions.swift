import Foundation

extension Date {
    /// ISO8601 格式字符串
    var iso8601String: String {
        ISO8601DateFormatter().string(from: self)
    }

    /// 友好的时间显示
    var friendlyString: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: self, relativeTo: Date())
    }

    /// 数据库存储格式
    var databaseString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter.string(from: self)
    }

    /// 从数据库字符串解析
    static func fromDatabaseString(_ string: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter.date(from: string)
    }
}