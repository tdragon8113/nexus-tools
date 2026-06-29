import { describe, expect, it } from 'vitest';
import { formatApiDateTime, formatTimeLabel, parseApiDateTime } from './datetime';

describe('formatApiDateTime', () => {
    it('formats local wall clock without timezone suffix', () => {
        const date = new Date(2026, 5, 29, 11, 30, 45);
        expect(formatApiDateTime(date)).toBe('2026-06-29T11:30:45');
    });
});

describe('parseApiDateTime', () => {
    it('treats naive datetime as local wall clock', () => {
        const parsed = parseApiDateTime('2026-06-29T11:30:00');
        expect(parsed.getFullYear()).toBe(2026);
        expect(parsed.getMonth()).toBe(5);
        expect(parsed.getDate()).toBe(29);
        expect(parsed.getHours()).toBe(11);
        expect(parsed.getMinutes()).toBe(30);
    });

    it('parses UTC instant when value ends with Z', () => {
        const parsed = parseApiDateTime('2026-06-29T03:30:00.000Z');
        expect(parsed.getTime()).toBe(new Date('2026-06-29T03:30:00.000Z').getTime());
    });
});

describe('formatTimeLabel', () => {
    it('shows HH:mm from naive API string', () => {
        expect(formatTimeLabel('2026-06-29T11:17:00')).toBe('11:17');
    });
});
