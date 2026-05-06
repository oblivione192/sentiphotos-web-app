import { SettingsIcon } from './Icons'

interface ProfileHeaderProps {
  name: string
  subtitle: string
  avatarUrl: string
  onSettingsClick?: () => void
}

function ProfileHeader({ name, subtitle, avatarUrl, onSettingsClick }: ProfileHeaderProps) {
  return (
    <header className="profile-header section-entrance delay-1">
      <img className="profile-avatar" src={avatarUrl} alt="Profile avatar" />
      <div className="profile-copy">
        <h1>{name}</h1>
        <p>{subtitle}</p>
      </div>
      <button className="settings-button" type="button" aria-label="Open settings" onClick={onSettingsClick}>
        <SettingsIcon />
      </button>
    </header>
  )
}

export default ProfileHeader
