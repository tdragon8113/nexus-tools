/** 桌面端由主进程 userData 持久化的 renderer 键（不经 localStorage） */
export const RENDERER_LOCAL_STATE_KEYS = {
  searchRecents: 'nexus-search-recents-v1',
  searchFavorites: 'nexus-search-favorites-v1',
  toolOrder: 'nexus-tool-order-v1',
  jsPlaygroundCode: 'nexus-js-playground-code',
  jsPlaygroundWrap: 'nexus-js-playground-wrap',
  calculatorTape: 'nexus-calculator-tape-v1',
  textEditorLanguage: 'nexus-text-editor-language',
  textEditorWrap: 'nexus-text-editor-wrap',
  textEditorMdView: 'nexus-text-editor-md-view',
  textDiffLanguage: 'nexus-text-diff-language',
  textDiffWrap: 'nexus-text-diff-wrap',
  textDiffOptions: 'nexus-text-diff-options'
} as const

export type RendererLocalStateMap = Record<string, string>

export const MANAGED_RENDERER_LOCAL_STATE_KEYS: readonly string[] = Object.values(
  RENDERER_LOCAL_STATE_KEYS
)

/** 旧版 localStorage / totp 迁移用 */
export const LEGACY_TOTP_STORAGE_KEY = 'nexus-totp-accounts-v1'
