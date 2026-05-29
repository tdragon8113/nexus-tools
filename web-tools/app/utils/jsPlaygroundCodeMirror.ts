import { autocompletion } from '@codemirror/autocomplete'
import type { Extension } from '@codemirror/state'
import { jsPlaygroundCompletionSource } from '~/utils/jsPlaygroundCompletions'

/** JS 运行编辑器：统一补全源 + 更快触发 */
export const jsPlaygroundAutocompleteExtension: Extension = autocompletion({
  activateOnTyping: true,
  activateOnTypingDelay: 80,
  defaultKeymap: true,
  maxRenderedOptions: 40,
  icons: true,
  override: [jsPlaygroundCompletionSource]
})
