import { onMounted, ref } from 'vue'

const DB_NAME = 'nexus-tools-json'
const STORE = 'snippets'
const MAX_ITEMS = 50

export type JsonHistoryItem = {
  id: string
  content: string
  createdAt: number
  preview: string
}

export function useJsonLocalHistory() {
  const items = ref<JsonHistoryItem[]>([])
  const panelOpen = ref(false)
  let dbPromise: Promise<IDBDatabase> | null = null

  function openDb(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('indexedDB unavailable'))
    }
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1)
        req.onerror = () => reject(req.error ?? new Error('IDB open failed'))
        req.onsuccess = () => resolve(req.result)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(STORE)) {
            const s = db.createObjectStore(STORE, { keyPath: 'id' })
            s.createIndex('createdAt', 'createdAt', { unique: false })
          }
        }
      })
    }
    return dbPromise
  }

  async function refresh() {
    if (typeof indexedDB === 'undefined') return
    try {
      const db = await openDb()
      const all = await new Promise<JsonHistoryItem[]>((resolve, reject) => {
        const r = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
        r.onsuccess = () => resolve((r.result as JsonHistoryItem[]) ?? [])
        r.onerror = () => reject(r.error)
      })
      all.sort((a, b) => b.createdAt - a.createdAt)
      items.value = all.slice(0, MAX_ITEMS)
    } catch {
      items.value = []
    }
  }

  async function prune(db: IDBDatabase) {
    const all = await new Promise<JsonHistoryItem[]>((resolve, reject) => {
      const r = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
      r.onsuccess = () => resolve((r.result as JsonHistoryItem[]) ?? [])
      r.onerror = () => reject(r.error)
    })
    if (all.length <= MAX_ITEMS) return
    all.sort((a, b) => b.createdAt - a.createdAt)
    const drop = all.slice(MAX_ITEMS)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      for (const d of drop) tx.objectStore(STORE).delete(d.id)
    })
  }

  async function recordSnapshot(content: string) {
    if (typeof indexedDB === 'undefined') return
    const trimmed = content.trim()
    if (!trimmed) return
    try {
      await refresh()
      if (items.value[0]?.content === content) return
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const item: JsonHistoryItem = {
        id,
        content,
        createdAt: Date.now(),
        preview: trimmed.replace(/\s+/g, ' ').slice(0, 96)
      }
      const db = await openDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.objectStore(STORE).put(item)
      })
      await prune(db)
      await refresh()
    } catch {
      /* 隐私模式或配额 */
    }
  }

  async function remove(id: string) {
    if (typeof indexedDB === 'undefined') return
    try {
      const db = await openDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.objectStore(STORE).delete(id)
      })
      await refresh()
    } catch {
      /* ignore */
    }
  }

  async function clearAll() {
    if (typeof indexedDB === 'undefined') return
    try {
      const db = await openDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.objectStore(STORE).clear()
      })
      await refresh()
    } catch {
      /* ignore */
    }
  }

  onMounted(() => {
    void refresh()
  })

  return {
    items,
    panelOpen,
    refresh,
    recordSnapshot,
    remove,
    clearAll
  }
}
