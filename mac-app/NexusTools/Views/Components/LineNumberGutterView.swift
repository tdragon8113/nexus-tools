import AppKit

/// 按「当前总行数」的位数计算行号栏宽度，避免固定很宽的 gutter。
enum LineNumberColumnMetrics {
    /// 与 `LineNumberGutterView.draw` 中 `lineRange` 推进方式一致（含文末插入点占用的空行），
    /// 不能改用 `enumerateSubstrings(.byLines)`：连续 `\n` / 仅换行时少计一行，会出现第 10 行仍按 1 位宽裁剪。
    static func logicalLineCount(_ text: String) -> Int {
        let ns = text as NSString
        let len = ns.length
        guard len > 0 else { return 1 }
        var lineStart = 0
        var n = 0
        while lineStart <= len {
            n += 1
            if lineStart >= len { break }
            let lr = ns.lineRange(for: NSRange(location: min(lineStart, max(0, len - 1)), length: 0))
            let next = NSMaxRange(lr)
            if next <= lineStart { break }
            lineStart = next
        }
        return max(1, n)
    }

    static func width(forText text: String, fontSize: CGFloat) -> CGFloat {
        let minW: CGFloat = 14
        let maxW: CGFloat = 64
        let extra: CGFloat = 6
        let lineCount = logicalLineCount(text)
        let digitCount = max(1, String(lineCount).count)
        let font = NSFont.monospacedDigitSystemFont(ofSize: fontSize, weight: .regular)
        let sample = String(repeating: "8", count: digitCount)
        let tw = (sample as NSString).size(withAttributes: [.font: font]).width
        return min(max(ceil(tw) + extra, minW), maxW)
    }
}

/// 贴在 `NSTextView` 左侧的同步行号栏（需配合 `textContainerInset` 左侧留白）。
final class LineNumberGutterView: NSView {
    private weak var textView: NSTextView?
    private var columnWidth: CGFloat
    private let digitFont: NSFont

    init(gutterWidth: CGFloat, fontSize: CGFloat) {
        self.columnWidth = gutterWidth
        self.digitFont = .monospacedDigitSystemFont(ofSize: fontSize, weight: .regular)
        super.init(frame: .zero)
        wantsLayer = true
        postsFrameChangedNotifications = true
        layer?.backgroundColor = NSColor.controlBackgroundColor.withAlphaComponent(0.92).cgColor
    }

    required init?(coder: NSCoder) {
        self.columnWidth = 20
        self.digitFont = .monospacedDigitSystemFont(ofSize: 11, weight: .regular)
        super.init(coder: coder)
    }

    /// 与 `PlainTextEditor` 传入的 `lineNumberGutterWidth` 同步（随正文行数变窄/略变宽）
    func setColumnWidth(_ width: CGFloat) {
        let w = max(12, width)
        guard abs(w - columnWidth) > 0.25 else { return }
        columnWidth = w
        layoutFrame()
        needsDisplay = true
    }

    func attach(to textView: NSTextView, clipView: NSClipView?) {
        self.textView = textView
        NotificationCenter.default.addObserver(self, selector: #selector(markDirty), name: NSText.didChangeNotification, object: textView)
        NotificationCenter.default.addObserver(self, selector: #selector(markDirty), name: NSView.frameDidChangeNotification, object: textView)
        if let storage = textView.textStorage {
            NotificationCenter.default.addObserver(self, selector: #selector(markDirty), name: NSTextStorage.didProcessEditingNotification, object: storage)
        }
        if let clip = clipView {
            clip.postsBoundsChangedNotifications = true
            NotificationCenter.default.addObserver(self, selector: #selector(markDirty), name: NSView.boundsDidChangeNotification, object: clip)
        }
        refreshLineNumbers()
    }

    /// 文本或滚动变化后由宿主调用（`PlainTextEditor` 在 `updateNSView` / `textDidChange` 里刷新）
    func refreshLineNumbers() {
        markDirty()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func markDirty() {
        layoutFrame()
        needsDisplay = true
    }

    private func layoutFrame() {
        guard let tv = textView else { return }
        frame = NSRect(x: 0, y: 0, width: columnWidth, height: tv.bounds.height)
    }

    override func hitTest(_ point: NSPoint) -> NSView? { nil }

    /// 行首字符在 `textView` 坐标系中的行片段矩形（避免使用已禁用的 `firstRect(forCharacterRange:)`）
    private func lineRectInTextView(forCharacter charIndex: Int) -> NSRect {
        guard let tv = textView, let lm = tv.layoutManager, let tc = tv.textContainer else { return .zero }
        let ns = tv.string as NSString
        let len = ns.length
        if len == 0 {
            // 空文档不能用 bounds.midY，否则行号会漂在编辑区垂直中央；用系统为「空行/插入点」保留的 fragment 矩形
            lm.ensureLayout(for: tc)
            let o = tv.textContainerOrigin
            var frag = lm.extraLineFragmentRect
            if frag.height < 0.5 {
                let h = max(1, lm.defaultLineHeight(for: tv.font ?? .systemFont(ofSize: 13)))
                frag = NSRect(x: 0, y: 0, width: max(tc.containerSize.width, 1), height: h)
            }
            return NSRect(
                x: frag.origin.x + o.x,
                y: frag.origin.y + o.y,
                width: max(frag.width, 1),
                height: max(frag.height, 1)
            )
        }
        let idx = min(max(0, charIndex), len - 1)
        let glyphIndex = lm.glyphIndexForCharacter(at: idx)
        var _eff = NSRange()
        let frag = lm.lineFragmentRect(forGlyphAt: glyphIndex, effectiveRange: &_eff)
        let o = tv.textContainerOrigin
        return NSRect(
            x: frag.origin.x + o.x,
            y: frag.origin.y + o.y,
            width: max(frag.width, 1),
            height: max(frag.height, 1)
        )
    }

    override func draw(_ dirtyRect: NSRect) {
        NSColor.separatorColor.withAlphaComponent(0.45).setStroke()
        let border = NSBezierPath()
        border.move(to: NSPoint(x: bounds.maxX - 0.5, y: bounds.minY))
        border.line(to: NSPoint(x: bounds.maxX - 0.5, y: bounds.maxY))
        border.lineWidth = 1
        border.stroke()

        guard let tv = textView, let lm = tv.layoutManager, let tc = tv.textContainer else { return }
        let ns = tv.string as NSString
        let len = ns.length

        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = .right
        let attrs: [NSAttributedString.Key: Any] = [
            .font: digitFont,
            .foregroundColor: NSColor.secondaryLabelColor,
            .paragraphStyle: paragraph,
        ]

        let textPadLeft: CGFloat = 1
        let textPadRight: CGFloat = 3
        let drawWidth = max(bounds.width - textPadLeft - textPadRight, 8)
        let drawX = textPadLeft

        if len == 0 {
            let s = "1" as NSString
            let sz = s.size(withAttributes: attrs)
            let tvRect = lineRectInTextView(forCharacter: 0)
            let r = convert(tvRect, from: tv)
            let y = r.minY + (r.height - sz.height) / 2
            s.draw(
                with: NSRect(x: drawX, y: y, width: drawWidth, height: max(sz.height, r.height)),
                options: [.usesLineFragmentOrigin],
                attributes: attrs
            )
            return
        }

        let visible = tv.visibleRect
        var glyphRange = lm.glyphRange(forBoundingRect: visible, in: tc)
        let sel = tv.selectedRange()
        glyphRange = NSUnionRange(
            glyphRange,
            lm.glyphRange(forCharacterRange: sel, actualCharacterRange: nil)
        )

        var charRange = lm.characterRange(forGlyphRange: glyphRange, actualGlyphRange: nil)
        if charRange.length == 0, charRange.location < len {
            charRange.length = 1
        }

        let caretLoc = min(max(0, sel.location), len)
        let caretLine = ns.lineRange(for: NSRange(location: caretLoc, length: 0))

        let visLo = charRange.location
        let visHi = max(charRange.location, NSMaxRange(charRange) - 1)
        let spanLo = min(visLo, caretLine.location)
        let spanHi = max(visHi, NSMaxRange(caretLine) - 1)

        var lineStart = ns.lineRange(for: NSRange(location: min(spanLo, len - 1), length: 0)).location
        let lastLineRange = ns.lineRange(for: NSRange(location: min(max(0, spanHi), len - 1), length: 0))
        var stopPast = NSMaxRange(lastLineRange)
        stopPast = max(stopPast, NSMaxRange(caretLine))

        var lineNumber = 1
        var scan = 0
        while scan < lineStart {
            if ns.character(at: scan) == 10 { lineNumber += 1 }
            scan += 1
        }

        while lineStart <= len {
            let tvRect: NSRect
            if lineStart == len {
                lm.ensureLayout(for: tc)
                let o = tv.textContainerOrigin
                var frag = lm.extraLineFragmentRect
                if frag.height < 0.5 {
                    // 勿用 y=0：在部分布局下会与首行行号同一高度，出现「1」与最后一行行号重叠
                    let h = max(1, lm.defaultLineHeight(for: tv.font ?? .systemFont(ofSize: 13)))
                    let g = lm.numberOfGlyphs
                    if g > 0 {
                        var eff = NSRange()
                        let lastFrag = lm.lineFragmentRect(forGlyphAt: g - 1, effectiveRange: &eff)
                        frag = NSRect(
                            x: lastFrag.origin.x,
                            y: lastFrag.maxY,
                            width: max(tc.containerSize.width, 1),
                            height: h
                        )
                    } else if len > 0 {
                        let tvBase = lineRectInTextView(forCharacter: len - 1)
                        frag = NSRect(
                            x: tvBase.origin.x - o.x,
                            y: tvBase.maxY - o.y,
                            width: max(tc.containerSize.width, 1),
                            height: h
                        )
                    } else {
                        frag = NSRect(x: 0, y: 0, width: max(tc.containerSize.width, 1), height: h)
                    }
                }
                tvRect = NSRect(
                    x: frag.origin.x + o.x,
                    y: frag.origin.y + o.y,
                    width: max(frag.width, 1),
                    height: max(frag.height, 1)
                )
            } else {
                tvRect = lineRectInTextView(forCharacter: lineStart)
            }

            let r = convert(tvRect, from: tv)
            let s = "\(lineNumber)" as NSString
            let sz = s.size(withAttributes: attrs)
            let y = r.minY + (r.height - sz.height) / 2
            s.draw(
                with: NSRect(x: drawX, y: y, width: drawWidth, height: max(sz.height, r.height)),
                options: [.usesLineFragmentOrigin],
                attributes: attrs
            )

            if lineStart >= len { break }

            let lr = ns.lineRange(for: NSRange(location: min(lineStart, max(0, len - 1)), length: 0))
            let next = NSMaxRange(lr)
            if next <= lineStart { break }
            lineStart = next
            lineNumber += 1
            // `stopPast` 常为「下一行行首」的字符下标；与 `len` 相等时若用 `>=` 会在这里直接退出，
            // 导致永远进不了 `lineStart == len` 分支，文末空行（刚按回车）不画行号。
            if lineStart >= stopPast, lineStart < len { break }
        }
    }
}
