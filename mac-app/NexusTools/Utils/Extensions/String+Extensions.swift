import Foundation

extension String {
    /// 是否为空白字符串
    var isBlank: Bool {
        trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    /// 是否为有效邮箱
    var isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        return NSPredicate(format: "SELF MATCHES %@", emailRegex).evaluate(with: self)
    }

    /// 截断到指定长度
    func truncated(to maxLength: Int, trailing: String = "...") -> String {
        if count <= maxLength { return self }
        return String(prefix(maxLength)) + trailing
    }

    /// URL 编码
    var urlEncoded: String {
        addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? self
    }

    /// Base64 编码
    var base64Encoded: String {
        data(using: .utf8)?.base64EncodedString() ?? self
    }

    /// Base64 解码
    var base64Decoded: String {
        guard let data = Data(base64Encoded: self) else { return self }
        return String(data: data, encoding: .utf8) ?? self
    }
}