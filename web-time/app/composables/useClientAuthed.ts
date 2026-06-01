/** @deprecated 请用 useAuthSession；保留别名避免大量改动 */
export function useClientAuthed () {
  const { mounted, authed, sync } = useAuthSession()
  return { mounted, authed, refresh: sync }
}
