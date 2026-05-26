/** 与 web-tools `BASE64_IMAGE_MAX_BYTES` 对应：约 10MB 图片的 Base64 文本上限 */
export const MAX_CLIPBOARD_TEXT_CHARS = Math.ceil((10 * 1024 * 1024 * 4) / 3) + 512
