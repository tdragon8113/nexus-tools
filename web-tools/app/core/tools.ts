/** 工具注册表：名称、路由、搜索关键词 */
export interface SiteTool {
  id: string
  name: string
  desc: string
  icon: string
  bgColor: string
  iconColor: string
  keywords?: string[]
  path?: `/${string}`
}

export const siteTools: SiteTool[] = [
  {
    id: 'json',
    name: 'JSON 格式化',
    desc: '美化/压缩',
    icon: 'description',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-500',
    path: '/tools/json',
    keywords: ['json', 'JSON', '格式化', '美化', '压缩', '校验', 'parse', 'stringify', 'jq']
  },
  {
    id: 'base64',
    name: 'Base64',
    desc: '编解码',
    icon: 'shield-o',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-500',
    path: '/tools/base64',
    keywords: ['base64', 'b64', '编解码', '编码', '解码']
  },
  {
    id: 'timestamp',
    name: '时间戳',
    desc: '时间转换',
    icon: 'clock-o',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-500',
    path: '/tools/timestamp',
    keywords: ['时间戳', 'timestamp', 'unix', '毫秒', '秒', '日期转换']
  },
  {
    id: 'qrcode',
    name: '二维码',
    desc: '生成解析',
    icon: 'qr',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-500',
    path: '/tools/qrcode',
    keywords: ['二维码', 'qr', 'qrcode', '条码']
  },
  {
    id: 'color',
    name: '颜色转换',
    desc: 'HEX/RGB',
    icon: 'brush-o',
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-500',
    path: '/tools/color',
    keywords: ['颜色', 'hex', 'rgb', 'hsl', '色值']
  },
  {
    id: 'regex',
    name: '正则测试',
    desc: 'Regex',
    icon: 'search',
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-500',
    path: '/tools/regex',
    keywords: ['正则', 'regex', 'regexp', '表达式']
  },
  {
    id: 'text-diff',
    name: '文本对比',
    desc: 'Diff',
    icon: 'notes-o',
    bgColor: 'bg-lime-100',
    iconColor: 'text-lime-600',
    path: '/tools/text-diff',
    keywords: ['文本对比', 'diff', 'compare', '差异', '比较', '文本比较', '对比', '比对', 'merge']
  },
  {
    id: 'http',
    name: 'HTTP 请求',
    desc: 'API 测试',
    icon: 'cluster-o',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-500',
    path: '/tools/http',
    keywords: ['http', 'https', 'api', '请求', 'rest', 'curl']
  },
  {
    id: 'uuid',
    name: 'UUID',
    desc: '唯一标识',
    icon: 'gift-o',
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-500',
    path: '/tools/uuid',
    keywords: ['uuid', 'guid', '唯一标识']
  },
  {
    id: 'password',
    name: '随机密码',
    desc: '安全生成',
    icon: 'closed-eye',
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    path: '/tools/password',
    keywords: ['密码', '随机密码', 'password', '口令', '生成密码', '强密码']
  },
  {
    id: 'calculator',
    name: '计算器',
    desc: '四则运算',
    icon: 'records',
    bgColor: 'bg-sky-100',
    iconColor: 'text-sky-600',
    path: '/tools/calculator',
    keywords: ['计算器', '计算', 'calculator', '算术', '加减乘除', '幂', '乘方', '算式', '数字', '数值', '+', '-', '*', '/']
  },
  {
    id: 'hash',
    name: 'MD5/SHA',
    desc: '哈希计算',
    icon: 'lock',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-500',
    path: '/tools/hash',
    keywords: ['md5', 'sha', 'sha256', '哈希', 'hash', '摘要']
  },
  {
    id: 'url',
    name: 'URL 编码',
    desc: '编解码',
    icon: 'link-o',
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-500',
    path: '/tools/url',
    keywords: ['url', 'encode', 'decode', '编码', 'URIComponent', '链接']
  },
  {
    id: 'code',
    name: '代码格式化',
    desc: 'Prettier',
    icon: 'coupon-o',
    bgColor: 'bg-violet-100',
    iconColor: 'text-violet-500',
    path: '/tools/code',
    keywords: ['prettier', '代码格式化', 'eslint', 'format', 'js', 'ts', 'html', 'css']
  },
  {
    id: 'more',
    name: '更多工具',
    desc: '敬请期待',
    icon: 'apps-o',
    bgColor: 'bg-slate-100',
    iconColor: 'text-slate-500',
    keywords: ['更多', '其它']
  }
]

export function getToolById(id: string): SiteTool | undefined {
  return siteTools.find((t) => t.id === id)
}

export function getToolByPath(path: string): SiteTool | undefined {
  return siteTools.find((t) => t.path === path)
}
