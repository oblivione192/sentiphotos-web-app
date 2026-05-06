import { TabIcon } from './Icons'
import type { TabItem, TabKey } from './types'

interface BottomNavigationProps {
  tabs: TabItem[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

function BottomNavigation({ tabs, activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav section-entrance delay-5" aria-label="Bottom navigation">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={`bottom-${tab.key}`}
            type="button"
            className={`bottom-nav-button${isActive ? ' active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            <TabIcon tab={tab.key} active={isActive} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNavigation
