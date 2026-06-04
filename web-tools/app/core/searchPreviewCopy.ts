import type { SearchPreviewLine, SearchPreviewModel } from '~/core/searchPreview'

export function isTotpSearchPreview(preview: SearchPreviewModel): boolean {
  return preview.title.includes('2FA') || preview.title.includes('TOTP')
}

export function resolveSearchPreviewLineCopyText(
  preview: SearchPreviewModel,
  line: SearchPreviewLine,
  index: number
): string | undefined {
  const direct = line.copyText?.trim()
  if (direct) return direct
  if (preview.lines.length === 1 && index === 0 && preview.copyText?.trim()) {
    return preview.copyText.trim()
  }
  return undefined
}

export function searchPreviewHasCopyableLines(preview: SearchPreviewModel): boolean {
  return preview.lines.some((line, index) =>
    Boolean(resolveSearchPreviewLineCopyText(preview, line, index))
  )
}

export type SearchPreviewLineView = SearchPreviewLine & {
  copyable: boolean
  copyText?: string
}

export function buildSearchPreviewLineViews(preview: SearchPreviewModel): SearchPreviewLineView[] {
  return preview.lines.map((line, index) => {
    const copyText = resolveSearchPreviewLineCopyText(preview, line, index)
    return {
      ...line,
      copyable: Boolean(copyText),
      copyText
    }
  })
}

export function copyToastMessageForPreview(preview: SearchPreviewModel): string {
  return isTotpSearchPreview(preview) ? '验证码已复制' : '已复制'
}
