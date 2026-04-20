import AppKit
import SwiftUI

/// 多行纯文本编辑：关闭系统「智能引号 / 破折号 / 文本替换」，避免键入 `"` 被改成弯引号（JSON、JWT 等场景）。
struct PlainTextEditor: NSViewRepresentable {
    @Binding var text: String
    var isEditable: Bool = true
    var fontSize: CGFloat = 13
    /// 为 `nil` 时不报告焦点（占位符等逻辑可选）
    var isEditing: Binding<Bool>? = nil
    /// 语法错误在 `text` 中的 UTF-16 范围；与系统拼写检查相同的红色波浪下划线（仅临时绘制，不改 `text`）
    var syntaxErrorUTF16Range: NSRange? = nil
    /// 多段差异高亮（如 JSON 双栏对比）；琥珀底 + 橙色下划线，后于 diff 再叠加语法错误样式
    var diffHighlightUTF16Ranges: [NSRange] = []
    /// 左侧行号栏（与 `lineNumberGutterWidth` 配合 `textContainerInset`）
    var showsLineNumbers: Bool = false
    /// 行号区宽度，需与 JSON 占位文案左侧缩进一致
    var lineNumberGutterWidth: CGFloat = 28
    var lineNumberFontSize: CGFloat = 11

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> NSScrollView {
        let scrollView = NSScrollView()
        scrollView.drawsBackground = false
        scrollView.borderType = .noBorder
        scrollView.hasVerticalScroller = true
        scrollView.hasHorizontalScroller = false
        scrollView.autohidesScrollers = true

        let textView = FocusReportingTextView()
        textView.coordinator = context.coordinator
        textView.drawsBackground = false
        textView.backgroundColor = .clear
        textView.delegate = context.coordinator
        textView.font = .systemFont(ofSize: fontSize)
        textView.textColor = .textColor
        textView.isEditable = isEditable
        textView.isSelectable = true
        textView.isRichText = false
        textView.importsGraphics = false
        textView.string = text
        Self.applySubstitutionDefaults(to: textView)

        if showsLineNumbers {
            textView.textContainerInset = NSSize(width: lineNumberGutterWidth, height: 4)
            let gutter = LineNumberGutterView(gutterWidth: lineNumberGutterWidth, fontSize: lineNumberFontSize)
            gutter.attach(to: textView, clipView: scrollView.contentView)
            textView.addSubview(gutter)
            context.coordinator.lineGutter = gutter
        } else {
            textView.textContainerInset = .zero
        }

        textView.minSize = .zero
        textView.maxSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        textView.isVerticallyResizable = true
        textView.isHorizontallyResizable = false
        textView.autoresizingMask = [.width]
        textView.textContainer?.lineFragmentPadding = 0
        textView.textContainer?.widthTracksTextView = true
        textView.textContainer?.containerSize = NSSize(width: scrollView.contentSize.width, height: CGFloat.greatestFiniteMagnitude)

        scrollView.documentView = textView
        context.coordinator.textView = textView
        return scrollView
    }

    func updateNSView(_ scrollView: NSScrollView, context: Context) {
        context.coordinator.parent = self
        guard let textView = scrollView.documentView as? NSTextView else { return }

        textView.isEditable = isEditable
        textView.font = .systemFont(ofSize: fontSize)
        Self.applySubstitutionDefaults(to: textView)

        let width = max(40, scrollView.contentView.bounds.width)
        textView.textContainer?.containerSize = NSSize(width: width, height: CGFloat.greatestFiniteMagnitude)

        if textView.string != text {
            textView.string = text
            if isEditable {
                let len = (text as NSString).length
                textView.setSelectedRange(NSRange(location: len, length: 0))
            }
        }

        Self.applyTemporaryHighlights(
            textView,
            diffRanges: diffHighlightUTF16Ranges,
            syntaxError: syntaxErrorUTF16Range
        )

        if showsLineNumbers {
            let w = lineNumberGutterWidth
            if textView.textContainerInset.width != w {
                textView.textContainerInset = NSSize(width: w, height: 4)
            }
            context.coordinator.lineGutter?.setColumnWidth(w)
        }
        context.coordinator.lineGutter?.refreshLineNumbers()
    }

    private static let highlightTempKeys: [NSAttributedString.Key] = [
        .spellingState,
        .backgroundColor,
        .underlineStyle,
        .underlineColor,
    ]

    /// 先清掉再画 diff（琥珀），再叠语法错误（红），避免互相残留
    private static func applyTemporaryHighlights(
        _ textView: NSTextView,
        diffRanges: [NSRange],
        syntaxError: NSRange?
    ) {
        guard let lm = textView.layoutManager else { return }
        let ns = textView.string as NSString
        let len = ns.length
        let full = NSRange(location: 0, length: len)
        for key in highlightTempKeys {
            lm.removeTemporaryAttribute(key, forCharacterRange: full)
        }

        let amber = NSColor(calibratedRed: 1, green: 0.88, blue: 0.35, alpha: 0.38)
        let orangeLine = NSColor(calibratedRed: 0.9, green: 0.42, blue: 0.02, alpha: 1)
        for r in diffRanges {
            guard r.location != NSNotFound, NSMaxRange(r) <= len else { continue }
            if r.length == 0 {
                guard r.location == len, len > 0 else { continue }
                let tail = NSRange(location: len - 1, length: 1)
                lm.addTemporaryAttribute(.backgroundColor, value: amber, forCharacterRange: tail)
                lm.addTemporaryAttribute(.underlineStyle, value: NSUnderlineStyle.thick.rawValue, forCharacterRange: tail)
                lm.addTemporaryAttribute(.underlineColor, value: orangeLine, forCharacterRange: tail)
                lm.addTemporaryAttribute(.spellingState, value: NSAttributedString.SpellingState.spelling.rawValue, forCharacterRange: tail)
                continue
            }
            lm.addTemporaryAttribute(.backgroundColor, value: amber, forCharacterRange: r)
            lm.addTemporaryAttribute(.underlineStyle, value: NSUnderlineStyle.thick.rawValue, forCharacterRange: r)
            lm.addTemporaryAttribute(.underlineColor, value: orangeLine, forCharacterRange: r)
            lm.addTemporaryAttribute(.spellingState, value: NSAttributedString.SpellingState.spelling.rawValue, forCharacterRange: r)
        }

        if let r = syntaxError, r.length > 0, r.location != NSNotFound, NSMaxRange(r) <= len {
            let waveRed = NSColor(calibratedRed: 0.92, green: 0.12, blue: 0.18, alpha: 1)
            let tint = NSColor(calibratedRed: 1, green: 0.35, blue: 0.35, alpha: 0.26)
            lm.addTemporaryAttribute(.backgroundColor, value: tint, forCharacterRange: r)
            lm.addTemporaryAttribute(.underlineStyle, value: NSUnderlineStyle.thick.rawValue, forCharacterRange: r)
            lm.addTemporaryAttribute(.underlineColor, value: waveRed, forCharacterRange: r)
            lm.addTemporaryAttribute(.spellingState, value: NSAttributedString.SpellingState.spelling.rawValue, forCharacterRange: r)
        }

        lm.invalidateDisplay(forCharacterRange: full)
    }

    private static func applySubstitutionDefaults(to textView: NSTextView) {
        textView.isAutomaticQuoteSubstitutionEnabled = false
        textView.isAutomaticDashSubstitutionEnabled = false
        textView.isAutomaticTextReplacementEnabled = false
        textView.isAutomaticSpellingCorrectionEnabled = false
        textView.isContinuousSpellCheckingEnabled = false
    }

    final class Coordinator: NSObject, NSTextViewDelegate {
        var parent: PlainTextEditor
        weak var textView: NSTextView?
        weak var lineGutter: LineNumberGutterView?

        init(_ parent: PlainTextEditor) {
            self.parent = parent
        }

        func focusChanged(_ focused: Bool) {
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.parent.isEditing?.wrappedValue = focused
            }
        }

        func textDidChange(_ notification: Notification) {
            guard parent.isEditable, let tv = textView else { return }
            parent.text = tv.string
            lineGutter?.refreshLineNumbers()
        }
    }
}

private final class FocusReportingTextView: NSTextView {
    weak var coordinator: PlainTextEditor.Coordinator?

    override func becomeFirstResponder() -> Bool {
        let ok = super.becomeFirstResponder()
        if ok { coordinator?.focusChanged(true) }
        return ok
    }

    override func resignFirstResponder() -> Bool {
        let ok = super.resignFirstResponder()
        if ok { coordinator?.focusChanged(false) }
        return ok
    }
}
