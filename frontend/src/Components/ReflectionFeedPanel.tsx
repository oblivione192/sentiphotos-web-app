import ReflectionGrid from './ReflectionGrid'
import type { ReflectionCard } from './types'

interface ReflectionFeedPanelProps {
  ariaLabel: string
  loading: boolean
  loadingText: string
  error: string
  reflections: ReflectionCard[]
  selectedReflectionId: string | null
  onSelectReflection: (reflectionId: string) => void
  onRequestDeleteReflection: (reflection: ReflectionCard) => void
  onRetry: () => void
  emptyTitle: string
  emptyDescription: string
}

function ReflectionFeedPanel({
  ariaLabel,
  loading,
  loadingText,
  error,
  reflections,
  selectedReflectionId,
  onSelectReflection,
  onRequestDeleteReflection,
  onRetry,
  emptyTitle,
  emptyDescription,
}: ReflectionFeedPanelProps) {
  if (loading) {
    return (
      <section className="reflection-scroll section-entrance delay-3" aria-label={ariaLabel}>
        <div className="reflection-status">{loadingText}</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="reflection-scroll section-entrance delay-3" aria-label={ariaLabel}>
        <div className="reflection-status error">
          <p>{error}</p>
          <button className="status-action" type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <ReflectionGrid
      ariaLabel={ariaLabel}
      reflections={reflections}
      selectedReflectionId={selectedReflectionId}
      onSelectReflection={onSelectReflection}
      onRequestDeleteReflection={onRequestDeleteReflection}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  )
}

export default ReflectionFeedPanel
