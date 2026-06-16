import { LanguageSupport, StreamLanguage } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

interface CsvStreamState {
  inQuotes: boolean
}

const csvStreamParser = {
  startState(): CsvStreamState {
    return { inQuotes: false }
  },

  token(stream: { peek(): string | null; next(): string | null; eol(): boolean }, state: CsvStreamState) {
    if (stream.eol()) return null

    if (state.inQuotes) {
      if (stream.peek() === '"') {
        stream.next()
        if (stream.peek() === '"') {
          stream.next()
          return t.string
        }
        state.inQuotes = false
        return t.string
      }
      stream.next()
      return t.string
    }

    if (stream.peek() === '"') {
      state.inQuotes = true
      stream.next()
      return t.string
    }

    if (stream.peek() === ',') {
      stream.next()
      return t.separator
    }

    while (stream.peek() !== null && stream.peek() !== ',' && stream.peek() !== '\n' && stream.peek() !== '\r') {
      stream.next()
    }
    return t.content
  },

  copyState(state: CsvStreamState): CsvStreamState {
    return { inQuotes: state.inQuotes }
  }
}

export function csvLanguageSupport(): Extension {
  return new LanguageSupport(StreamLanguage.define(csvStreamParser))
}
