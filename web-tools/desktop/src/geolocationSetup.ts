import { session } from 'electron'

export function setupGeolocationPermissions(): void {
  const ses = session.defaultSession

  ses.setPermissionCheckHandler((_webContents, permission) => permission === 'geolocation')

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'geolocation')
  })
}
