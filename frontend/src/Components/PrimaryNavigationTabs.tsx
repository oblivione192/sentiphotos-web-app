import { TabIcon } from './Icons'
import type { TabItem, TabKey } from './types'

interface PrimaryNavigationTabsProps {
  tabs: TabItem[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

function PrimaryNavigationTabs({ tabs, activeTab, onTabChange }: PrimaryNavigationTabsProps) {
  return (
    <nav className="top-tabs section-entrance delay-2" aria-label="Primary tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            className={`tab-button${isActive ? ' active' : ''}`}
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

export default PrimaryNavigationTabs
