import type { CSSProperties } from 'react'

import { SparkIcon, TrashIcon } from './Icons'
import type { ReflectionCard } from './types'

interface ReflectionGridProps {
  reflections: ReflectionCard[]
  selectedReflectionId: string | null
  onSelectReflection: (reflectionId: string) => void
  onRequestDeleteReflection: (reflection: ReflectionCard) => void
  ariaLabel?: string
  emptyTitle?: string
  emptyDescription?: string
}

function ReflectionGrid({
  reflections,
  selectedReflectionId,
  onSelectReflection,
  onRequestDeleteReflection,
  ariaLabel = 'Reflections',
  emptyTitle = 'No reflections yet',
  emptyDescription = 'Create your first reflection to start building your gallery.',
}: ReflectionGridProps) {
  if (reflections.length === 0) {
    return (
      <section className="reflection-scroll section-entrance delay-3" aria-label={ariaLabel}>
        <div className="reflection-empty-state">
          <h2>{emptyTitle}</h2>
          <p>{emptyDescription}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="reflection-scroll section-entrance delay-3" aria-label={ariaLabel}>
      <div className="reflection-grid">
        {reflections.map((reflection, index) => {
          const isSelected = reflection.id === selectedReflectionId
          const animationStyle = {
            '--delay': `${140 + index * 75}ms`,
          } as CSSProperties

          return (
            <article
              key={reflection.id}
              className={`reflection-card-shell${isSelected ? ' selected' : ''}`}
              style={animationStyle}
            >
              <button
                type="button"
                className={`reflection-card${isSelected ? ' selected' : ''}`}
                onClick={() => onSelectReflection(reflection.id)}
                aria-label={`Open reflection ${reflection.title}`}
              >
                <img src={reflection.image} alt={reflection.title} loading="lazy" />
                <div className="card-overlay">
                  <h2>{reflection.title}</h2>
                  <p className="mood-chip">
                    <SparkIcon />
                    {reflection.mood}
                  </p>
                  <p className="photo-count">{reflection.photos} photos</p>
                </div>
              </button>
              <button
                type="button"
                className="reflection-delete-button"
                onClick={() => onRequestDeleteReflection(reflection)}
                aria-label={`Delete reflection ${reflection.title}`}
              >
                <TrashIcon />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ReflectionGrid
