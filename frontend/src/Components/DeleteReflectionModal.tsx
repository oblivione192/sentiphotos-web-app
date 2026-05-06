import type { ReflectionCard } from './types'

interface DeleteReflectionModalProps {
  reflection: ReflectionCard | null
  deleting: boolean
  error: string
  onCancel: () => void
  onConfirm: () => void
}

function DeleteReflectionModal({
  reflection,
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteReflectionModalProps) {
  if (!reflection) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="delete-reflection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-reflection-title"
        aria-describedby="delete-reflection-description"
      >
        <h2 id="delete-reflection-title">Delete reflection?</h2>
        <p id="delete-reflection-description">
          This will permanently delete "{reflection.title}" and its images from your gallery.
        </p>

        {error ? <p className="delete-reflection-error">{error}</p> : null}

        <div className="delete-reflection-actions">
          <button
            className="modal-secondary-action"
            type="button"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="modal-danger-action"
            type="button"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default DeleteReflectionModal
