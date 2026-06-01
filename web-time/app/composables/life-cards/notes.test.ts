import { describe, expect, it } from 'vitest'
import {
  buildRecordNotes,
  decodeCardMarker,
  encodeCardMarker,
  parseRecordNotes
} from './notes'

describe('life-cards notes', () => {
  it('round-trips card marker', () => {
    const notes = buildRecordNotes('daily', 'daily_cook', '做了晚饭', 4, ['美食'])
    expect(decodeCardMarker(notes)).toEqual({ parentId: 'daily', childId: 'daily_cook' })
  })

  it('parses summary feeling and tags', () => {
    const notes = `[work/work_code]
总结：修好了登录问题
感受：5
标签：开发,紧急`
    const parsed = parseRecordNotes(notes)
    expect(parsed.summary).toBe('修好了登录问题')
    expect(parsed.feelingRating).toBe(5)
    expect(parsed.tags).toEqual(['开发', '紧急'])
  })

  it('encodeCardMarker supports parent only', () => {
    expect(encodeCardMarker('sport')).toBe('[sport]')
  })
})
