import type { StorageService } from './interfaces'

class InMemoryStorageService implements StorageService {
  private storage: Map<string, string> = new Map()

  async setItem<T>(key: string, value: T): Promise<void> {
    this.storage.set(key, JSON.stringify(value))
  }

  async getItem<T>(key: string): Promise<T | null> {
    const item = this.storage.get(key)
    if (!item) return null
    
    try {
      return JSON.parse(item) as T
    } catch (error) {
      console.error('Error parsing stored item:', error)
      return null
    }
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }
}

export const storageService = new InMemoryStorageService()