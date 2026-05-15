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

/** 时间管理站侧栏（接后端） */
export const workbenchNavGroups: WorkbenchNavGroup[] = [
  {
    title: '时间管理',
    items: [
      { label: '概览', to: '/manage/time', icon: 'notes-o', exact: true },
      { label: '此刻时钟', to: '/manage/time/clock', icon: 'clock-o' },
      { label: '时间戳互转', to: '/manage/time/timestamp', icon: 'exchange' },
      { label: '番茄专注', to: '/manage/time/pomodoro', icon: 'fire-o' },
      { label: '习惯追踪', to: '/manage/time/habits', icon: 'star-o' },
      { label: '日程管理', to: '/manage/time/schedule', icon: 'calendar-o' },
      { label: '时间统计', to: '/manage/time/stats', icon: 'bar-chart-o' }
    ]
  },
  {
    title: '账号',
    items: [
      { label: '个人中心', to: '/profile', icon: 'user-o', exact: true }
    ]
  }
]
