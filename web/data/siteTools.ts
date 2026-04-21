/** 首页工具卡片（与路由一致的可点击，其余为占位） */
export interface SiteTool {
  id: string
  name: string
  desc: string
  icon: string
  bgColor: string
  iconColor: string
  /** 搜索同义词：中英文、常见写法 */
  keywords?: string[]
  /** 已实现则跳转该路径 */
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
    keywords: ['json', 'JSON', '格式化', '美化', '压缩', '校验', 'parse', 'stringify']
  },
  {
    id: 'timehub',
    name: '时间管理',
    desc: '独立工作台 · 日程与专注',
    icon: 'notes-o',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    path: '/manage/time',
    keywords: [
      '时间管理',
      '番茄钟',
      'pomodoro',
      '专注',
      '日程',
      '计划',
      '工作台',
      '管理台',
      '时钟'
    ]
  },
  {
    id: 'base64',
    name: 'Base64',
    desc: '编解码',
    icon: 'shield-o',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-500',
    keywords: ['base64', 'b64', '编解码', '编码', '解码']
  },
  {
    id: 'timestamp',
    name: '时间戳',
    desc: '时间转换',
    icon: 'clock-o',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-500',
    keywords: ['时间戳', 'timestamp', 'unix', '毫秒', '秒', '日期转换']
  },
  {
    id: 'qrcode',
    name: '二维码',
    desc: '生成解析',
    icon: 'qr',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-500',
    keywords: ['二维码', 'qr', 'qrcode', '条码']
  },
  {
    id: 'color',
    name: '颜色转换',
    desc: 'HEX/RGB',
    icon: 'brush-o',
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-500',
    keywords: ['颜色', 'hex', 'rgb', 'hsl', '色值']
  },
  {
    id: 'regex',
    name: '正则测试',
    desc: 'Regex',
    icon: 'search',
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-500',
    keywords: ['正则', 'regex', 'regexp', '表达式']
  },
  {
    id: 'http',
    name: 'HTTP 请求',
    desc: 'API 测试',
    icon: 'cluster-o',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-500',
    keywords: ['http', 'https', 'api', '请求', 'rest', 'curl']
  },
  {
    id: 'uuid',
    name: 'UUID',
    desc: '唯一标识',
    icon: 'gift-o',
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-500',
    keywords: ['uuid', 'guid', '唯一标识']
  },
  {
    id: 'hash',
    name: 'MD5/SHA',
    desc: '哈希计算',
    icon: 'lock',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-500',
    keywords: ['md5', 'sha', 'sha256', '哈希', 'hash', '摘要']
  },
  {
    id: 'url',
    name: 'URL 编码',
    desc: '编解码',
    icon: 'link-o',
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-500',
    keywords: ['url', 'encode', 'decode', '编码', 'URIComponent', '链接']
  },
  {
    id: 'code',
    name: '代码格式化',
    desc: 'Prettier',
    icon: 'coupon-o',
    bgColor: 'bg-violet-100',
    iconColor: 'text-violet-500',
    keywords: ['prettier', '代码格式化', 'eslint', 'format']
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
