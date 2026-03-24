import { EffectType, GlitchParams, AsciiParams } from '@/types'

export type SavedDesign = {
  id: string
  effectType: EffectType
  name: string
  glitchParams: GlitchParams
  asciiParams: AsciiParams
  thumbnail: string
  sourceImageDataUrl?: string
  createdAt: number
}

const DB_NAME = 'nano-design-saved'
const STORE_NAME = 'designs'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const store = db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
        const req = fn(store)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export async function getSavedDesigns(): Promise<SavedDesign[]> {
  const all = await tx<SavedDesign[]>('readonly', (s) => s.getAll())
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

function generateThumbnail(canvas: HTMLCanvasElement): string {
  const size = 120
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  const ctx = offscreen.getContext('2d')!
  ctx.drawImage(canvas, 0, 0, size, size)
  return offscreen.toDataURL('image/jpeg', 0.6)
}

export async function saveDesign(
  effectType: EffectType,
  glitchParams: GlitchParams,
  asciiParams: AsciiParams,
  canvas: HTMLCanvasElement,
  sourceImageDataUrl?: string,
): Promise<SavedDesign | null> {
  const all = await getSavedDesigns()

  // 去重：相同 effect + 相同参数 + 相同来源图片
  const duplicate = all.find(
    (d) =>
      d.effectType === effectType &&
      JSON.stringify(d.glitchParams) === JSON.stringify(glitchParams) &&
      JSON.stringify(d.asciiParams) === JSON.stringify(asciiParams) &&
      (d.sourceImageDataUrl ?? null) === (sourceImageDataUrl ?? null),
  )
  if (duplicate) return null

  const count = all.filter((d) => d.effectType === effectType).length

  const design: SavedDesign = {
    id: crypto.randomUUID(),
    effectType,
    name: `${effectType} #${count + 1}`,
    glitchParams: { ...glitchParams },
    asciiParams: { ...asciiParams },
    thumbnail: generateThumbnail(canvas),
    ...(sourceImageDataUrl ? { sourceImageDataUrl } : {}),
    createdAt: Date.now(),
  }

  await tx('readwrite', (s) => s.put(design))
  return design
}

export async function deleteDesign(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id))
}

export async function renameDesign(id: string, name: string): Promise<void> {
  const design = await tx<SavedDesign>('readonly', (s) => s.get(id))
  if (!design) return
  design.name = name
  await tx('readwrite', (s) => s.put(design))
}
