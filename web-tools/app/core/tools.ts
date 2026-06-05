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
  }
]

export function getToolById(id: string): SiteTool | undefined {
  return siteTools.find((t) => t.id === id)
}

export function getToolByPath(path: string): SiteTool | undefined {
  return siteTools.find((t) => t.path === path)
}
