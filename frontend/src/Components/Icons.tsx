import type { TabKey } from './types'

interface ActiveIconProps {
  active: boolean
}

interface TabIconProps {
  tab: TabKey
  active: boolean
}

export function TabIcon({ tab, active }: TabIconProps) {
  switch (tab) {
    case 'reflections':
      return <ReflectionsIcon active={active} />
    case 'favorites':
      return <FavoritesIcon active={active} />
    case 'notifications':
      return <NotificationsIcon active={active} />
    default:
      return null
  }
}

function ReflectionsIcon({ active }: ActiveIconProps) {
  const strokeWidth = active ? 2.05 : 1.8

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="14" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="4" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="14" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  )
}

function FavoritesIcon({ active }: ActiveIconProps) {
  const strokeWidth = active ? 2.1 : 1.85

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.02 20.7c-.2 0-.4-.06-.57-.19-1.59-1.2-3.16-2.54-4.7-4.02C4.96 14.76 3.2 12.9 3.2 10.04c0-2.46 1.9-4.39 4.3-4.39 1.77 0 3.28.86 4.52 2.56 1.25-1.7 2.76-2.56 4.53-2.56 2.39 0 4.28 1.93 4.28 4.39 0 2.86-1.75 4.72-3.55 6.45a39.1 39.1 0 0 1-4.68 4.02c-.18.13-.37.19-.58.19Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}

function NotificationsIcon({ active }: ActiveIconProps) {
  const strokeWidth = active ? 2.05 : 1.8

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M18 15.2V10a6 6 0 0 0-12 0v5.2l-1.8 2.1c-.58.68-.1 1.74.8 1.74h13.99c.91 0 1.39-1.06.81-1.74L18 15.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M9.3 19.05a2.7 2.7 0 0 0 5.4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SettingsIcon() {
  return (
    <svg className="settings-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.02 3.51h3.96l.54 1.96c.28.1.55.21.82.34l1.8-.93 2.8 2.8-.92 1.8c.13.27.24.55.34.83l1.95.53v3.97l-1.95.53c-.1.28-.2.56-.34.83l.92 1.8-2.8 2.8-1.8-.93c-.27.14-.54.25-.82.35l-.54 1.96h-3.96l-.53-1.96c-.28-.1-.56-.21-.83-.35l-1.8.93-2.8-2.8.92-1.8a6.7 6.7 0 0 1-.34-.83l-1.95-.53v-3.97l1.95-.53c.1-.28.21-.56.34-.83l-.92-1.8 2.8-2.8 1.8.93c.27-.13.55-.24.83-.34l.53-1.96Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function SparkIcon() {
  return (
    <svg className="spark-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3.4 1.74 4.41 4.44 1.74-4.44 1.75L12 15.7 10.25 11.3 5.8 9.55l4.45-1.74L12 3.4Z" fill="currentColor" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg className="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5.4 7.2h13.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.3 7.2V5.5c0-.72.58-1.3 1.3-1.3h2.8c.72 0 1.3.58 1.3 1.3v1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7.2 7.2.7 11.3c.06.9.8 1.6 1.7 1.6h4.8c.9 0 1.64-.7 1.7-1.6l.7-11.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10.4 10.6v5.7M13.6 10.6v5.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg className="plus-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5.2v13.6M5.2 12h13.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
