export interface WorkbenchNavItem {
  label: string
  to: string
  icon: string
  exact?: boolean
  prefix?: string
}

export interface WorkbenchNavGroup {
  title: string
  items: WorkbenchNavItem[]
}

/** 纯工具站侧栏（不接后端） */
export const workbenchNavGroups: WorkbenchNavGroup[] = [
  {
    title: '工作台',
    items: [
      { label: '首页', to: '/', icon: 'wap-home-o', exact: true }
    ]
  },
  {
    title: '开发者工具',
    items: [
      { label: 'JSON 格式化', to: '/tools/json', icon: 'description', prefix: '/tools/json' },
      { label: 'Base64', to: '/tools/base64', icon: 'shield-o', prefix: '/tools/base64' },
      { label: '时间戳', to: '/tools/timestamp', icon: 'clock-o', prefix: '/tools/timestamp' },
      { label: 'URL 编码', to: '/tools/url', icon: 'link-o', prefix: '/tools/url' },
      { label: 'UUID', to: '/tools/uuid', icon: 'gift-o', prefix: '/tools/uuid' },
      { label: '随机密码', to: '/tools/password', icon: 'closed-eye', prefix: '/tools/password' },
      { label: '计算器', to: '/tools/calculator', icon: 'records', prefix: '/tools/calculator' },
      { label: '二维码', to: '/tools/qrcode', icon: 'qr', prefix: '/tools/qrcode' },
      { label: '颜色', to: '/tools/color', icon: 'brush-o', prefix: '/tools/color' },
      { label: '正则', to: '/tools/regex', icon: 'search', prefix: '/tools/regex' },
      { label: 'HTTP', to: '/tools/http', icon: 'cluster-o', prefix: '/tools/http' },
      { label: '哈希', to: '/tools/hash', icon: 'lock', prefix: '/tools/hash' },
      { label: '格式化', to: '/tools/code', icon: 'coupon-o', prefix: '/tools/code' }
    ]
  }
]
