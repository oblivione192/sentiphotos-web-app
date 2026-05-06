export type TabKey = 'reflections' | 'favorites' | 'notifications'

export interface TabItem {
  key: TabKey
  label: string
}

export interface ReflectionCard {
  id: string
  title: string
  mood: string
  photos: number
  image: string
}
