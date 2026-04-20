import SwiftUI
import AppKit

/// JSON 工具视图 - 单框简洁设计（`PlainTextEditor` 关闭智能引号，避免 `"` 被替换为弯引号）
struct JSONToolView: View {
    /// 编辑区与占位共用同一内缩，避免光标贴边、与占位不对齐
    private static let contentInset: CGFloat = 6
    /// 编辑区左侧略收紧，行号更贴近圆角框（右侧仍用 `contentInset`）
    private static let editorLeadingInset: CGFloat = 3
    private static let lineNumberFontSize: CGFloat = 11

    var initialInput: String = ""
    @Binding var isCompareMode: Bool
    @State private var content: String = ""
    @State private var compareLeft: String = ""
    @State private var compareRight: String = ""
    @State private var errorMessage: String?
    @State private var successMessage: String?
    @State private var hasProcessedInitialInput = false
    @State private var isEditorFocused = false
    @State private var isLeftCompareFocused = false
    @State private var isRightCompareFocused = false
    @State private var syntaxErrorUTF16Range: NSRange?
    @State private var syntaxErrorLeft: NSRange?
    @State private var syntaxErrorRight: NSRange?
    @State private var diffLeftRanges: [NSRange] = []
    @State private var diffRightRanges: [NSRange] = []
    @State private var syntaxValidateWorkItem: DispatchWorkItem?
    @State private var compareValidateWorkItem: DispatchWorkItem?

    var body: some View {
        let lineGutter = LineNumberColumnMetrics.width(forText: content, fontSize: Self.lineNumberFontSize)
        let gutterL = LineNumberColumnMetrics.width(forText: compareLeft, fontSize: Self.lineNumberFontSize)
        let gutterR = LineNumberColumnMetrics.width(forText: compareRight, fontSize: Self.lineNumberFontSize)

        VStack(spacing: 8) {
            if isCompareMode {
                compareEditors(gutterL: gutterL, gutterR: gutterR)
            } else {
                singleEditor(lineGutter: lineGutter)
            }

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 12))
                    .foregroundColor(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 8)
            } else if let success = successMessage {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text(success)
                        .font(.system(size: 12))
                        .foregroundColor(.green)
                }
                .padding(.horizontal, 8)
            }

            if isCompareMode {
                HStack(spacing: 8) {
                    Button(action: formatCompareBoth) {
                        Label("格式化两侧", systemImage: "text.alignleft")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)

                    Button(action: { copyString(compareLeft) }) {
                        Label("复制左", systemImage: "doc.on.doc")
                    }
                    .buttonStyle(.bordered)
                    .disabled(compareLeft.isEmpty)

                    Button(action: { copyString(compareRight) }) {
                        Label("复制右", systemImage: "doc.on.doc")
                    }
                    .buttonStyle(.bordered)
                    .disabled(compareRight.isEmpty)

                    Button(action: clearCompareBoth) {
                        Label("清空", systemImage: "trash")
                    }
                    .buttonStyle(.bordered)
                    .disabled(compareLeft.isEmpty && compareRight.isEmpty)
                }
            } else {
                HStack(spacing: 8) {
                    Button(action: formatJSON) {
                        Label("格式化", systemImage: "text.alignleft")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)

                    Button(action: minifyJSON) {
                        Label("压缩", systemImage: "text.justify")
                    }
                    .buttonStyle(.bordered)

                    Button(action: copyContent) {
                        Label("复制", systemImage: "doc.on.doc")
                    }
                    .buttonStyle(.bordered)
                    .disabled(content.isEmpty)

                    Button(action: clearAll) {
                        Label("清空", systemImage: "trash")
                    }
                    .buttonStyle(.bordered)
                    .disabled(content.isEmpty)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .padding(.horizontal, 12)
        .padding(.top, 6)
        .padding(.bottom, 8)
        .onAppear {
            if !initialInput.isEmpty && !hasProcessedInitialInput {
                content = initialInput
                hasProcessedInitialInput = true
                formatJSON()
            }
        }
        .onChange(of: isCompareMode) { _, on in
            if on {
                compareLeft = content
                compareRight = ""
                clearMessages()
                scheduleCompareValidation()
            } else {
                content = compareLeft
                syntaxErrorLeft = nil
                syntaxErrorRight = nil
                diffLeftRanges = []
                diffRightRanges = []
                scheduleSyntaxValidation(for: content)
            }
        }
        .onChange(of: content) { _, newValue in
            guard !isCompareMode else { return }
            scheduleSyntaxValidation(for: newValue)
        }
        .onChange(of: compareLeft) { _, _ in
            guard isCompareMode else { return }
            scheduleCompareValidation()
        }
        .onChange(of: compareRight) { _, _ in
            guard isCompareMode else { return }
            scheduleCompareValidation()
        }
    }

    @ViewBuilder
    private func singleEditor(lineGutter: CGFloat) -> some View {
        ZStack(alignment: .topLeading) {
            PlainTextEditor(
                text: $content,
                isEditing: $isEditorFocused,
                syntaxErrorUTF16Range: syntaxErrorUTF16Range,
                showsLineNumbers: true,
                lineNumberGutterWidth: lineGutter,
                lineNumberFontSize: Self.lineNumberFontSize
            )
            .padding(.top, Self.contentInset)
            .padding(.leading, Self.editorLeadingInset)
            .padding(.bottom, Self.contentInset)
            .padding(.trailing, Self.contentInset)
            .frame(maxWidth: .infinity, minHeight: 200, maxHeight: .infinity, alignment: .topLeading)

            if content.isEmpty && !isEditorFocused {
                Text("输入 JSON 内容...")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                    .padding(.top, Self.contentInset)
                    .padding(.leading, Self.editorLeadingInset + lineGutter)
                    .padding(.bottom, Self.contentInset)
                    .padding(.trailing, Self.contentInset)
                    .allowsHitTesting(false)
            }
        }
        .background(Color(nsColor: .textBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(Color.secondary.opacity(0.35), lineWidth: 1)
                .allowsHitTesting(false)
        )
    }

    private func compareEditors(gutterL: CGFloat, gutterR: CGFloat) -> some View {
        HStack(alignment: .top, spacing: 8) {
            compareEditorColumn(
                title: "左侧 JSON",
                text: $compareLeft,
                isFocused: $isLeftCompareFocused,
                gutter: gutterL,
                syntax: syntaxErrorLeft,
                diff: diffLeftRanges
            )
            compareEditorColumn(
                title: "右侧 JSON",
                text: $compareRight,
                isFocused: $isRightCompareFocused,
                gutter: gutterR,
                syntax: syntaxErrorRight,
                diff: diffRightRanges
            )
        }
        .frame(maxHeight: .infinity)
    }

    private func compareEditorColumn(
        title: String,
        text: Binding<String>,
        isFocused: Binding<Bool>,
        gutter: CGFloat,
        syntax: NSRange?,
        diff: [NSRange]
    ) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.secondary)
            ZStack(alignment: .topLeading) {
                PlainTextEditor(
                    text: text,
                    isEditing: isFocused,
                    syntaxErrorUTF16Range: syntax,
                    diffHighlightUTF16Ranges: diff,
                    showsLineNumbers: true,
                    lineNumberGutterWidth: gutter,
                    lineNumberFontSize: Self.lineNumberFontSize
                )
                .padding(.top, Self.contentInset)
                .padding(.leading, Self.editorLeadingInset)
                .padding(.bottom, Self.contentInset)
                .padding(.trailing, Self.contentInset)
                .frame(maxWidth: .infinity, minHeight: 160, maxHeight: .infinity, alignment: .topLeading)

                if text.wrappedValue.isEmpty && !isFocused.wrappedValue {
                    Text("输入 JSON 内容...")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                        .padding(.top, Self.contentInset)
                        .padding(.leading, Self.editorLeadingInset + gutter)
                        .padding(.bottom, Self.contentInset)
                        .padding(.trailing, Self.contentInset)
                        .allowsHitTesting(false)
                }
            }
            .background(Color(nsColor: .textBackgroundColor))
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(Color.secondary.opacity(0.35), lineWidth: 1)
                    .allowsHitTesting(false)
            )
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Syntax highlight

    private func scheduleSyntaxValidation(for text: String) {
        syntaxValidateWorkItem?.cancel()
        if text.isEmpty {
            syntaxErrorUTF16Range = nil
            return
        }
        let snapshot = text
        let work = DispatchWorkItem { [snapshot] in
            let range = OrderedJSONSerializer.syntaxErrorUTF16Range(in: snapshot)
            DispatchQueue.main.async {
                if content == snapshot {
                    syntaxErrorUTF16Range = range
                }
            }
        }
        syntaxValidateWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22, execute: work)
    }

    private func scheduleCompareValidation() {
        compareValidateWorkItem?.cancel()
        let leftSnap = compareLeft
        let rightSnap = compareRight
        let work = DispatchWorkItem {
            let errL = leftSnap.isEmpty ? nil : OrderedJSONSerializer.syntaxErrorUTF16Range(in: leftSnap)
            let errR = rightSnap.isEmpty ? nil : OrderedJSONSerializer.syntaxErrorUTF16Range(in: rightSnap)
            let (dL, dR) = JSONCompareLineDiff.mismatchUTF16Ranges(left: leftSnap, right: rightSnap)
            DispatchQueue.main.async {
                guard isCompareMode, compareLeft == leftSnap, compareRight == rightSnap else { return }
                syntaxErrorLeft = errL
                syntaxErrorRight = errR
                diffLeftRanges = dL
                diffRightRanges = dR
            }
        }
        compareValidateWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22, execute: work)
    }

    // MARK: - Actions

    private func formatJSON() {
        clearMessages()

        guard !content.isEmpty else {
            errorMessage = "请输入内容"
            return
        }

        guard let data = content.data(using: .utf8) else {
            errorMessage = "无法解析输入"
            return
        }

        do {
            content = try OrderedJSONSerializer.serialize(data, pretty: true)
            successMessage = "格式化成功"
            syntaxErrorUTF16Range = nil
        } catch {
            errorMessage = "JSON 错误: \(error.localizedDescription)"
            syntaxErrorUTF16Range = OrderedJSONSerializer.syntaxErrorUTF16Range(in: content)
        }
    }

    private func minifyJSON() {
        clearMessages()

        guard !content.isEmpty else {
            errorMessage = "请输入内容"
            return
        }

        guard let data = content.data(using: .utf8) else {
            errorMessage = "无法解析输入"
            return
        }

        do {
            content = try OrderedJSONSerializer.serialize(data, pretty: false)
            successMessage = "压缩成功"
            syntaxErrorUTF16Range = nil
        } catch {
            errorMessage = "JSON 错误: \(error.localizedDescription)"
            syntaxErrorUTF16Range = OrderedJSONSerializer.syntaxErrorUTF16Range(in: content)
        }
    }

    private func copyContent() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(content, forType: .string)
        successMessage = "已复制"

        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            if successMessage == "已复制" {
                successMessage = nil
            }
        }
    }

    private func clearAll() {
        content = ""
        clearMessages()
    }

    private func formatCompareBoth() {
        clearMessages()
        if compareLeft.isEmpty, compareRight.isEmpty {
            errorMessage = "请输入至少一侧内容"
            return
        }
        var okL = true
        var okR = true
        if !compareLeft.isEmpty {
            guard let d = compareLeft.data(using: .utf8) else {
                errorMessage = "左侧无法解析为 UTF-8"
                return
            }
            do {
                compareLeft = try OrderedJSONSerializer.serialize(d, pretty: true)
            } catch {
                okL = false
                errorMessage = "左侧 JSON 错误: \(error.localizedDescription)"
                syntaxErrorLeft = OrderedJSONSerializer.syntaxErrorUTF16Range(in: compareLeft)
            }
        }
        if !compareRight.isEmpty {
            guard let d = compareRight.data(using: .utf8) else {
                errorMessage = (errorMessage ?? "") + (errorMessage == nil ? "" : " ") + "右侧无法解析为 UTF-8"
                return
            }
            do {
                compareRight = try OrderedJSONSerializer.serialize(d, pretty: true)
            } catch {
                okR = false
                let msg = "右侧 JSON 错误: \(error.localizedDescription)"
                errorMessage = (errorMessage == nil) ? msg : "\(errorMessage!)；\(msg)"
                syntaxErrorRight = OrderedJSONSerializer.syntaxErrorUTF16Range(in: compareRight)
            }
        }
        if okL, okR {
            successMessage = "两侧已格式化"
            syntaxErrorLeft = nil
            syntaxErrorRight = nil
        }
        scheduleCompareValidation()
    }

    private func copyString(_ s: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(s, forType: .string)
        successMessage = "已复制"
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            if successMessage == "已复制" { successMessage = nil }
        }
    }

    private func clearCompareBoth() {
        compareLeft = ""
        compareRight = ""
        clearMessages()
        syntaxErrorLeft = nil
        syntaxErrorRight = nil
        diffLeftRanges = []
        diffRightRanges = []
    }

    private func clearMessages() {
        errorMessage = nil
        successMessage = nil
    }
}

// MARK: - 按行 LCS 对齐的差异行（用于双栏高亮）

private enum JSONCompareLineDiff {
    /// 按 `\n` 切行后的 UTF-16 范围（含行尾换行符，便于整行染色）；末尾单独 `\n` 会多出一段空行 `location == len, length == 0`
    private static func visualLineRanges(in string: String) -> [NSRange] {
        let ns = string as NSString
        let len = ns.length
        guard len > 0 else { return [NSRange(location: 0, length: 0)] }
        var ranges: [NSRange] = []
        var start = 0
        var i = 0
        while i < len {
            if ns.character(at: i) == 10 {
                ranges.append(NSRange(location: start, length: i - start + 1))
                start = i + 1
            }
            i += 1
        }
        if start < len {
            ranges.append(NSRange(location: start, length: len - start))
        } else if start == len {
            ranges.append(NSRange(location: len, length: 0))
        }
        return ranges
    }

    private static func lineTexts(for ranges: [NSRange], ns: NSString) -> [String] {
        ranges.map { r in
            var t = ns.substring(with: r)
            if t.hasSuffix("\n") {
                t.removeLast()
            }
            return t
        }
    }

    /// 对左右文本做按行最长公共子序列回溯，标出不匹配/仅左有/仅右有的行 UTF-16 范围
    static func mismatchUTF16Ranges(left: String, right: String) -> ([NSRange], [NSRange]) {
        let lr = visualLineRanges(in: left)
        let rr = visualLineRanges(in: right)
        let lns = left as NSString
        let rns = right as NSString
        let ls = lineTexts(for: lr, ns: lns)
        let rs = lineTexts(for: rr, ns: rns)
        let n = ls.count
        let m = rs.count
        if n == 0, m == 0 { return ([], []) }
        var dp = [[Int]](repeating: [Int](repeating: 0, count: m + 1), count: n + 1)
        for i in 1 ... n {
            for j in 1 ... m {
                if ls[i - 1] == rs[j - 1] {
                    dp[i][j] = dp[i - 1][j - 1] + 1
                } else {
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
                }
            }
        }
        var leftBad = Set<Int>()
        var rightBad = Set<Int>()
        var i = n
        var j = m
        while i > 0 || j > 0 {
            if i > 0, j > 0, ls[i - 1] == rs[j - 1] {
                i -= 1
                j -= 1
            } else if j > 0, i == 0 || dp[i][j - 1] >= dp[i - 1][j] {
                rightBad.insert(j - 1)
                j -= 1
            } else if i > 0 {
                leftBad.insert(i - 1)
                i -= 1
            } else {
                rightBad.insert(j - 1)
                j -= 1
            }
        }
        let lRanges = leftBad.sorted().compactMap { idx -> NSRange? in
            guard idx >= 0, idx < lr.count else { return nil }
            return lr[idx]
        }
        let rRanges = rightBad.sorted().compactMap { idx -> NSRange? in
            guard idx >= 0, idx < rr.count else { return nil }
            return rr[idx]
        }
        return (lRanges, rRanges)
    }
}

// MARK: - UTF-8 递归下降解析：对象键严格按源码出现顺序输出（不依赖 JSONSerialization / JSONDecoder.allKeys）

private enum OrderedJSONSerializer {
    private enum JSONNode {
        case object([(String, JSONNode)])
        case array([JSONNode])
        case string(String)
        case int(Int64)
        case double(Double)
        case bool(Bool)
        case null
    }

    private struct ParseError: Error, LocalizedError {
        let message: String
        /// 错误在 UTF-8 编码下的起始字节下标（用于在编辑器中定位）
        let utf8ByteOffset: Int
        var errorDescription: String? { message }
    }

    private struct UTF8JSONParser {
        private let bytes: [UInt8]
        private var i = 0

        init(data: Data) {
            self.bytes = Array(data)
        }

        private func parseError(_ message: String, at utf8ByteOffset: Int? = nil) -> ParseError {
            let o = utf8ByteOffset ?? i
            let clamped = bytes.isEmpty ? 0 : min(max(0, o), bytes.count - 1)
            return ParseError(message: message, utf8ByteOffset: clamped)
        }

        mutating func parseRoot() throws -> JSONNode {
            skipWhitespace()
            if i < bytes.count, bytes[i] == 0xEF, i + 2 < bytes.count, bytes[i + 1] == 0xBB, bytes[i + 2] == 0xBF {
                i += 3
                skipWhitespace()
            }
            let v = try parseValue()
            skipWhitespace()
            guard i == bytes.count else { throw parseError("JSON 根之后有多余内容", at: i) }
            return v
        }

        private mutating func skipWhitespace() {
            while i < bytes.count {
                switch bytes[i] {
                case 0x20, 0x09, 0x0A, 0x0D: i += 1
                default: return
                }
            }
        }

        private mutating func parseValue() throws -> JSONNode {
            skipWhitespace()
            guard i < bytes.count else { throw parseError("JSON 意外结束", at: max(0, bytes.count - 1)) }
            switch bytes[i] {
            case 0x7B: return try parseObject()
            case 0x5B: return try parseArray()
            case 0x22: return .string(try parseString())
            case 0x74: try expectLiteral("true"); return .bool(true)
            case 0x66: try expectLiteral("false"); return .bool(false)
            case 0x6E: try expectLiteral("null"); return .null
            case 0x2D, 0x30 ... 0x39: return try parseNumber()
            default: throw parseError("无效的 JSON 起始字符")
            }
        }

        private mutating func expectLiteral(_ s: String) throws {
            let need = Array(s.utf8)
            guard i + need.count <= bytes.count else { throw parseError("JSON 意外结束", at: max(0, bytes.count - 1)) }
            for (j, b) in need.enumerated() where bytes[i + j] != b {
                throw parseError("无效的 JSON 字面量", at: i + j)
            }
            i += need.count
        }

        private mutating func parseObject() throws -> JSONNode {
            guard bytes[i] == 0x7B else { throw parseError("应为 '{'") }
            i += 1
            skipWhitespace()
            var pairs: [(String, JSONNode)] = []
            if i < bytes.count, bytes[i] == 0x7D {
                i += 1
                return .object(pairs)
            }
            while true {
                skipWhitespace()
                guard bytes[i] == 0x22 else { throw parseError("对象键应为字符串") }
                let key = try parseString()
                skipWhitespace()
                guard i < bytes.count, bytes[i] == 0x3A else { throw parseError("应为 ':'") }
                i += 1
                let val = try parseValue()
                pairs.append((key, val))
                skipWhitespace()
                guard i < bytes.count else { throw parseError("对象未闭合") }
                if bytes[i] == 0x7D { i += 1; return .object(pairs) }
                guard bytes[i] == 0x2C else { throw parseError("应为 ',' 或 '}'") }
                let commaByte = i
                i += 1
                skipWhitespace()
                guard i < bytes.count else { throw parseError("对象未闭合", at: commaByte) }
                if bytes[i] == 0x7D {
                    throw parseError("不允许对象尾随逗号", at: commaByte)
                }
            }
        }

        private mutating func parseArray() throws -> JSONNode {
            guard bytes[i] == 0x5B else { throw parseError("应为 '['") }
            i += 1
            skipWhitespace()
            var items: [JSONNode] = []
            if i < bytes.count, bytes[i] == 0x5D {
                i += 1
                return .array(items)
            }
            while true {
                items.append(try parseValue())
                skipWhitespace()
                guard i < bytes.count else { throw parseError("数组未闭合") }
                if bytes[i] == 0x5D { i += 1; return .array(items) }
                guard bytes[i] == 0x2C else { throw parseError("应为 ',' 或 ']'") }
                let commaByte = i
                i += 1
                skipWhitespace()
                guard i < bytes.count else { throw parseError("数组未闭合", at: commaByte) }
                if bytes[i] == 0x5D {
                    throw parseError("不允许数组尾随逗号", at: commaByte)
                }
            }
        }

        private mutating func parseString() throws -> String {
            guard bytes[i] == 0x22 else { throw parseError("应为 '\"'") }
            i += 1
            var out = ""
            out.reserveCapacity(32)
            while i < bytes.count {
                let b = bytes[i]
                if b == 0x22 {
                    i += 1
                    return out
                }
                if b == 0x5C {
                    i += 1
                    guard i < bytes.count else { throw parseError("字符串未闭合") }
                    switch bytes[i] {
                    case 0x22: out.append("\""); i += 1; continue
                    case 0x5C: out.append("\\"); i += 1; continue
                    case 0x2F: out.append("/"); i += 1; continue
                    case 0x62: out.append("\u{08}"); i += 1; continue
                    case 0x66: out.append("\u{0C}"); i += 1; continue
                    case 0x6E: out.append("\n"); i += 1; continue
                    case 0x72: out.append("\r"); i += 1; continue
                    case 0x74: out.append("\t"); i += 1; continue
                    case 0x75:
                        i += 1
                        let unit = try readHex4()
                        if UTF16.isLeadSurrogate(unit) {
                            guard i + 6 <= bytes.count, bytes[i] == 0x5C, bytes[i + 1] == 0x75 else {
                                throw parseError("不完整的代理对转义")
                            }
                            i += 2
                            let low = try readHex4()
                            guard UTF16.isTrailSurrogate(low) else { throw parseError("无效的代理对") }
                            let hi = UInt32(unit) - 0xD800
                            let lo = UInt32(low) - 0xDC00
                            let cp = 0x10000 + (hi << 10) + lo
                            guard let scalar = UnicodeScalar(cp) else { throw parseError("无效的 Unicode 标量") }
                            out.unicodeScalars.append(scalar)
                            continue
                        }
                        if UTF16.isTrailSurrogate(unit) {
                            throw parseError("孤立的低位代理")
                        }
                        guard let scalar = UnicodeScalar(UInt32(unit)) else {
                            throw parseError("无效的 \\u 转义")
                        }
                        out.unicodeScalars.append(scalar)
                        continue
                    default:
                        throw parseError("无效的转义序列")
                    }
                }
                guard let scalar = readUTF8Scalar() else { throw parseError("无效的 UTF-8") }
                out.unicodeScalars.append(scalar)
            }
            throw parseError("字符串未闭合")
        }

        private mutating func readHex4() throws -> UInt16 {
            guard i + 4 <= bytes.count else { throw parseError("\\u 后需要 4 位十六进制") }
            var v: UInt16 = 0
            for _ in 0 ..< 4 {
                let h = try hexValue(bytes[i])
                v = (v << 4) | h
                i += 1
            }
            return v
        }

        private func hexValue(_ b: UInt8) throws -> UInt16 {
            switch b {
            case 0x30 ... 0x39: return UInt16(b - 0x30)
            case 0x41 ... 0x46: return UInt16(10 + b - 0x41)
            case 0x61 ... 0x66: return UInt16(10 + b - 0x61)
            default: throw parseError("无效的十六进制数字")
            }
        }

        private mutating func readUTF8Scalar() -> UnicodeScalar? {
            guard i < bytes.count else { return nil }
            let b0 = bytes[i]
            if b0 < 0x80 {
                i += 1
                return UnicodeScalar(b0)
            }
            if (b0 & 0xE0) == 0xC0, i + 1 < bytes.count {
                let b1 = bytes[i + 1]
                guard (b1 & 0xC0) == 0x80 else { return nil }
                let c = UInt32(b0 & 0x1F) << 6 | UInt32(b1 & 0x3F)
                guard c >= 0x80 else { return nil }
                i += 2
                return UnicodeScalar(c)
            }
            if (b0 & 0xF0) == 0xE0, i + 2 < bytes.count {
                let b1 = bytes[i + 1], b2 = bytes[i + 2]
                guard (b1 & 0xC0) == 0x80, (b2 & 0xC0) == 0x80 else { return nil }
                let c = UInt32(b0 & 0x0F) << 12 | UInt32(b1 & 0x3F) << 6 | UInt32(b2 & 0x3F)
                guard (0x0800 ... 0xFFFF).contains(c), !(0xD800 ... 0xDFFF).contains(c) else { return nil }
                i += 3
                return UnicodeScalar(c)
            }
            if (b0 & 0xF8) == 0xF0, i + 3 < bytes.count {
                let b1 = bytes[i + 1], b2 = bytes[i + 2], b3 = bytes[i + 3]
                guard (b1 & 0xC0) == 0x80, (b2 & 0xC0) == 0x80, (b3 & 0xC0) == 0x80 else { return nil }
                let c = UInt32(b0 & 0x07) << 18 | UInt32(b1 & 0x3F) << 12 | UInt32(b2 & 0x3F) << 6 | UInt32(b3 & 0x3F)
                guard (0x10000 ... 0x10FFFF).contains(c) else { return nil }
                i += 4
                return UnicodeScalar(c)
            }
            return nil
        }

        private mutating func parseNumber() throws -> JSONNode {
            let start = i
            if bytes[i] == 0x2D { i += 1 }
            guard i < bytes.count else { throw parseError("数字不完整", at: start) }
            if bytes[i] == 0x30 {
                i += 1
                if i < bytes.count, (0x30 ... 0x39).contains(bytes[i]), bytes[i] != 0x2E {
                    throw parseError("数字不能有前导零", at: i)
                }
            } else if (0x31 ... 0x39).contains(bytes[i]) {
                i += 1
                while i < bytes.count, (0x30 ... 0x39).contains(bytes[i]) { i += 1 }
            } else {
                throw parseError("无效的数字")
            }
            if i < bytes.count, bytes[i] == 0x2E {
                i += 1
                guard i < bytes.count, (0x30 ... 0x39).contains(bytes[i]) else { throw parseError("无效的小数") }
                while i < bytes.count, (0x30 ... 0x39).contains(bytes[i]) { i += 1 }
            }
            if i < bytes.count, bytes[i] == 0x65 || bytes[i] == 0x45 {
                i += 1
                if i < bytes.count, bytes[i] == 0x2B || bytes[i] == 0x2D { i += 1 }
                guard i < bytes.count, (0x30 ... 0x39).contains(bytes[i]) else { throw parseError("无效的指数") }
                while i < bytes.count, (0x30 ... 0x39).contains(bytes[i]) { i += 1 }
            }
            let slice = bytes[start ..< i]
            let text = String(decoding: slice, as: UTF8.self)
            if let intVal = Int64(text) {
                return .int(intVal)
            }
            guard let d = Double(text) else { throw parseError("无法解析的数字", at: start) }
            return .double(d)
        }
    }

    /// 若 `string` 不是合法 JSON，返回首处语法错误在 `string` 中的 UTF-16 范围（用于波浪下划线）；合法则 `nil`。
    static func syntaxErrorUTF16Range(in string: String) -> NSRange? {
        guard !string.isEmpty, let data = string.data(using: .utf8) else { return nil }
        var p = UTF8JSONParser(data: data)
        do {
            _ = try p.parseRoot()
            return nil
        } catch let e as ParseError {
            return nsRangeForUTF8ByteOrigin(in: string, utf8ByteOffset: e.utf8ByteOffset)
        } catch {
            return nil
        }
    }

    /// 将 UTF-8 字节偏移映射到包含该字节的字符的 UTF-16 范围
    private static func nsRangeForUTF8ByteOrigin(in string: String, utf8ByteOffset: Int) -> NSRange? {
        guard !string.isEmpty else { return nil }
        var utf16Loc = 0
        var byteLoc = 0
        for ch in string {
            let charByteLen = ch.utf8.count
            let charUtf16Len = ch.utf16.count
            if utf8ByteOffset >= byteLoc, utf8ByteOffset < byteLoc + charByteLen {
                return NSRange(location: utf16Loc, length: max(1, charUtf16Len))
            }
            byteLoc += charByteLen
            utf16Loc += charUtf16Len
        }
        let ns = string as NSString
        if utf8ByteOffset >= byteLoc, ns.length > 0 {
            return NSRange(location: max(0, ns.length - 1), length: 1)
        }
        return NSRange(location: 0, length: min(1, ns.length))
    }

    static func serialize(_ data: Data, pretty: Bool) throws -> String {
        var p = UTF8JSONParser(data: data)
        let node = try p.parseRoot()
        return stringify(node, indent: "", pretty: pretty)
    }

    private static func stringify(_ node: JSONNode, indent: String, pretty: Bool) -> String {
        switch node {
        case .null:
            return "null"
        case let .bool(v):
            return v ? "true" : "false"
        case let .int(v):
            return "\(v)"
        case let .double(v):
            return formatDouble(v)
        case let .string(s):
            return escapeString(s)
        case let .array(arr):
            if arr.isEmpty { return "[]" }
            let next = pretty ? indent + "  " : ""
            let sepComma = pretty ? ",\n" : ","
            if pretty {
                let body = arr.map { next + stringify($0, indent: next, pretty: true) }.joined(separator: sepComma)
                return "[\n" + body + "\n\(indent)]"
            }
            return "[" + arr.map { stringify($0, indent: indent, pretty: false) }.joined(separator: ",") + "]"
        case let .object(pairs):
            if pairs.isEmpty { return "{}" }
            let next = pretty ? indent + "  " : ""
            let sepComma = pretty ? ",\n" : ","
            let sepColon = pretty ? " : " : ":"
            if pretty {
                let body = pairs.map { pair in
                    let inner = stringify(pair.1, indent: next, pretty: true)
                    return next + escapeString(pair.0) + sepColon + inner
                }.joined(separator: sepComma)
                return "{\n" + body + "\n\(indent)}"
            }
            return "{" + pairs.map { escapeString($0.0) + sepColon + stringify($0.1, indent: indent, pretty: false) }.joined(separator: sepComma) + "}"
        }
    }

    private static func formatDouble(_ d: Double) -> String {
        if d.isNaN || d.isInfinite { return "0" }
        if abs(d.rounded() - d) < 1e-9, d >= Double(Int64.min), d <= Double(Int64.max) {
            return "\(Int64(d))"
        }
        return String(d)
    }

    private static func escapeString(_ s: String) -> String {
        var out = "\""
        for ch in s.unicodeScalars {
            switch ch.value {
            case 0x22: out += "\\\""
            case 0x5C: out += "\\\\"
            case 0x08: out += "\\b"
            case 0x0C: out += "\\f"
            case 0x0A: out += "\\n"
            case 0x0D: out += "\\r"
            case 0x09: out += "\\t"
            case 0x20 ... 0x7E where ch.value != 0x5C && ch.value != 0x22:
                out.unicodeScalars.append(ch)
            default:
                if ch.value < 0x20 {
                    out += String(format: "\\u%04x", ch.value)
                } else {
                    out.unicodeScalars.append(ch)
                }
            }
        }
        out += "\""
        return out
    }
}

#Preview {
    JSONToolView(isCompareMode: .constant(false))
        .frame(width: 400, height: 360)
}
