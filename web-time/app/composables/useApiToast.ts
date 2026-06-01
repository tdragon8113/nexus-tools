import { showToast } from 'vant'
import type { ApiResponse } from '~/types/api'

export function showApiError (res: ApiResponse<unknown>, fallback: string) {
  showToast(res.message || fallback)
}
