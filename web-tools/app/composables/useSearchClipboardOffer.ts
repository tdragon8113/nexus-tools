import { useDesktopClipboardPrefs } from '~/composables/useDesktopClipboardPrefs'
import { takeDesktopSearchInput } from '~/composables/useDesktopSearchInput'
import {
  decideClipboardIngest,
  hashClipboardText,
  summarizeClipboardOffer
} from '~/core/desktopClipboardPolicy'

export function useSearchClipboardOffer(deps: {
  commandQuery: Ref<string>
  getExistingQueryText: () => string
  ingestFullText: (text: string, options: { fromClipboard: boolean }) => void
  focusQuery: () => void
  scheduleRemeasure: () => void
}) {
  const route = useRoute()
  const clipboardPrefs = useDesktopClipboardPrefs()
  const pendingSearchInput = useDesktopSearchInput()
  const offerText = ref('')
  const offerLabel = ref('')

  const hasOffer = computed(() => Boolean(offerText.value.trim()))

  function clearOffer() {
    offerText.value = ''
    offerLabel.value = ''
  }

  function showOffer(text: string) {
    offerText.value = text
    offerLabel.value = summarizeClipboardOffer(text)
    deps.scheduleRemeasure()
  }

  async function markApplied(text: string) {
    await clipboardPrefs.markClipboardApplied(hashClipboardText(text))
  }

  async function ingest(text: string) {
    deps.ingestFullText(text, { fromClipboard: true })
    clearOffer()
    await markApplied(text)
    deps.focusQuery()
  }

  async function acceptOffer() {
    const text = offerText.value.trim()
    if (!text) return
    await ingest(text)
  }

  async function dismissOffer() {
    const text = offerText.value.trim()
    if (text) {
      await clipboardPrefs.dismissClipboardHash(hashClipboardText(text))
    }
    clearOffer()
  }

  async function applyPendingInput() {
    if (!clipboardPrefs.loaded.value) await clipboardPrefs.syncFromMain()

    const existingQuery = deps.getExistingQueryText().trim()

    const pending = takeDesktopSearchInput()
    if (pending) {
      const clip = pending.clipboard?.trim()
      const q = pending.q?.trim()
      const source = pending.source ?? 'hotkey'

      if (clip) {
        const clipHash = hashClipboardText(clip)
        if (existingQuery && hashClipboardText(existingQuery) === clipHash) {
          await markApplied(clip)
          clearOffer()
          if (q) deps.commandQuery.value = q
          return
        }

        const decision = decideClipboardIngest({
          policy: clipboardPrefs.policy.value,
          source,
          text: clip,
          lastAppliedHash: clipboardPrefs.lastAppliedHash.value,
          dismissedHash: clipboardPrefs.dismissedHash.value,
          existingQueryText: existingQuery
        })
        if (decision.action === 'autofill') {
          await ingest(clip)
          return
        }
        if (decision.action === 'hint') {
          showOffer(clip)
          return
        }
      }

      if (q) {
        clearOffer()
        deps.commandQuery.value = q
      }
      return
    }

    const q = typeof route.query.q === 'string' ? route.query.q : ''
    if (q) {
      clearOffer()
      deps.commandQuery.value = q
    }
  }

  function onQueryPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain') ?? ''
    if (!text.trim()) return
    event.preventDefault()
    clearOffer()
    void ingest(text)
  }

  async function markQueryTextAsApplied(text: string) {
    const t = text.trim()
    if (!t) return
    await markApplied(t)
  }

  return {
    clipboardPrefs,
    pendingSearchInput,
    offerText,
    offerLabel,
    hasOffer,
    clearOffer,
    showOffer,
    acceptOffer,
    dismissOffer,
    applyPendingInput,
    markQueryTextAsApplied,
    onQueryPaste
  }
}
