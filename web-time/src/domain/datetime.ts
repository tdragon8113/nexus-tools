/** 与后端 LocalDateTime（无时区）对齐：读写均用用户本地墙钟时间。 */

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

/** 发送给 API 的 datetime 字符串（本地 YYYY-MM-DDTHH:mm:ss，不带 Z） */
export function formatApiDateTime(date: Date): string {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** 解析 API 返回的 datetime（无时区视为本地；带 Z/偏移则按 instant） */
export function parseApiDateTime(value: string): Date {
    if (!value) {
        return new Date(Number.NaN);
    }
    if (/[Zz]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) {
        return new Date(value);
    }
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            Number(match[4]),
            Number(match[5]),
            Number(match[6] ?? 0),
            0,
        );
    }
    return new Date(value);
}

export function formatTimeLabel(value: string | Date): string {
    const date = value instanceof Date ? value : parseApiDateTime(value);
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
