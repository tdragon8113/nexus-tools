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
    id: 'totp',
    name: '2FA / TOTP',
    desc: '双因素验证码',
    icon: 'certificate',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    path: '/tools/totp',
    keywords: [
      '2fa',
      'totp',
      'otp',
      'otpauth',
      '双因素',
      '两步验证',
      '验证码',
      'authenticator',
      'google authenticator',
      'mfa'
    ]
  },
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
    id: 'text',
    name: '文本编辑',
    desc: '高亮/替换/处理',
    icon: 'edit',
    bgColor: 'bg-stone-100',
    iconColor: 'text-stone-600',
    path: '/tools/text',
    keywords: [
      '文本',
      '文本编辑',
      '纯文本',
      'plain',
      'text',
      '记事',
      'note',
      '粘贴',
      '剪贴板',
      'markdown',
      'md',
      '标记',
      'csv',
      '逗号分隔'
    ]
  },
  {
    id: 'table',
    name: '表格转换',
    desc: 'CSV/Excel/JSON 互转',
    icon: 'orders-o',
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    path: '/tools/table',
    keywords: [
      '表格',
      'table',
      'csv',
      'tsv',
      'excel',
      'xlsx',
      'json',
      'markdown',
      'html',
      'sql',
      '转换',
      'tableconvert',
      '导入',
      '导出'
    ]
  },
  {
    id: 'ip',
    name: 'IP 查询',
    desc: '归属地与运营商',
    icon: 'location-o',
    bgColor: 'bg-violet-100',
    iconColor: 'text-violet-600',
    path: '/tools/ip',
    keywords: [
      'ip',
      'IP',
      'ip地址',
      'IP地址',
      'ipv4',
      'ipv6',
      '归属地',
      '地理位置',
      'whois',
      '运营商',
      'asn',
      '本机ip',
      '公网ip'
    ]
  },
  {
    id: 'geo',
    name: '经纬度查询',
    desc: '坐标反查地址',
    icon: 'aim',
    bgColor: 'bg-rose-100',
    iconColor: 'text-rose-600',
    path: '/tools/geo',
    keywords: [
      '经纬度',
      '坐标',
      '纬度',
      '经度',
      '地理编码',
      '反查',
      'geocode',
      'coordinates',
      'coordinate',
      'lat',
      'lng',
      'latitude',
      'longitude',
      'gps',
      '定位'
    ]
  }
]

export function getToolById(id: string): SiteTool | undefined {
  return siteTools.find((t) => t.id === id)
}

export function getToolByPath(path: string): SiteTool | undefined {
  return siteTools.find((t) => t.path === path)
}
