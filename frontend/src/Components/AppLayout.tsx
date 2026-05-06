import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import useProfile from '../Stores/Profile'
import BottomNavigation from './BottomNavigation'
import CreateReflectionButton from './CreateReflectionButton'
import PrimaryNavigationTabs from './PrimaryNavigationTabs'
import ProfileHeader from './ProfileHeader'
import type { TabItem, TabKey } from './types'

const tabs: TabItem[] = [
  { key: 'reflections', label: 'Reflections' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'notifications', label: 'Notifications' },
]

function getActiveTab(pathname: string): TabKey {
  if (pathname.includes('/favourites') || pathname.includes('/favorites')) {
    return 'favorites'
  }

  return 'reflections'
}

function getHeaderSubtitle(pathname: string): string {
  if (pathname.includes('/create-reflection')) {
    return 'Capture a moment for your gallery'
  }

  if (pathname.includes('/favourites') || pathname.includes('/favorites')) {
    return 'Keeping image-rich reflections close'
  }

  return 'Collecting quiet moments'
}

function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const username = useProfile((state) => state.username)
  const clearProfile = useProfile((state) => state.clearProfile)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutPending, setLogoutPending] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [localActiveTab, setLocalActiveTab] = useState<TabKey | null>(null)

  const profileName = username || 'My Gallery'
  const activeTab = localActiveTab ?? getActiveTab(pathname)
  const showCreateButton = !pathname.includes('/create-reflection')
  const subtitle = getHeaderSubtitle(pathname)

  const avatarUrl = useMemo(() => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=e4c7a8&color=4f3928&rounded=true&size=120`
  }, [profileName])

  useEffect(() => {
    setLocalActiveTab(null)
  }, [pathname])

  const handleTabChange = (tab: TabKey) => {
    setLocalActiveTab(null)

    if (tab === 'reflections') {
      navigate('/home')
      return
    }

    if (tab === 'favorites') {
      navigate('/favourites')
      return
    }

    setLocalActiveTab(tab)
  }

  const handleLogout = async () => {
    setSettingsError('')
    setLogoutPending(true)

    try {
      const response = await fetch('/auth/users/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        setSettingsError('Unable to log out right now. Please try again.')
        return
      }

      clearProfile()
      navigate('/login')
    } catch {
      setSettingsError('Connection issue. Please try again.')
    } finally {
      setLogoutPending(false)
    }
  }

  return (
    <main className="home-page" aria-label="Authenticated gallery">
      <div className="settings-wrapper">
        <ProfileHeader
          name={profileName}
          subtitle={subtitle}
          avatarUrl={avatarUrl}
          onSettingsClick={() => {
            setSettingsError('')
            setSettingsOpen((current) => !current)
          }}
        />

        {settingsOpen ? (
          <div className="settings-panel" role="menu" aria-label="Settings menu">
            <button
              className="settings-panel-action"
              type="button"
              onClick={() => void handleLogout()}
              disabled={logoutPending}
            >
              {logoutPending ? 'Logging out...' : 'Log out'}
            </button>
            {settingsError ? <p className="settings-panel-error">{settingsError}</p> : null}
          </div>
        ) : null}
      </div>

      <PrimaryNavigationTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="app-layout-content">
        <Outlet />
      </div>

      <div className="cta-area">
        {showCreateButton ? (
          <CreateReflectionButton onClick={() => navigate('/create-reflection')} />
        ) : null}
      </div>

      <BottomNavigation tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
    </main>
  )
}

export default AppLayout
