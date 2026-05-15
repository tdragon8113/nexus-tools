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
      { label: 'JSON 格式化', to: '/tools/json', icon: 'description', prefix: '/tools' }
    ]
  }
]
