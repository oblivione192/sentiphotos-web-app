import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import ImageUploadGrid, { type SelectedReflectionImage } from './ImageUploadGrid'

type SaveState = 'idle' | 'saving' | 'saved'

interface CreateReflectionFormProps {
  title: string
  content: string
  images: SelectedReflectionImage[]
  maxImages: number
  totalUploadSize: number
  error: string
  saveState: SaveState
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onAddImages: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (imageId: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function CreateReflectionForm({
  title,
  content,
  images,
  maxImages,
  totalUploadSize,
  error,
  saveState,
  onTitleChange,
  onContentChange,
  onAddImages,
  onRemoveImage,
  onSubmit,
}: CreateReflectionFormProps) {
  const isSaving = saveState === 'saving'

  return (
    <section className="reflection-form-panel section-entrance delay-3" aria-label="Create reflection page">
      <header className="reflection-form-header">
        <p className="reflection-form-kicker">New Reflection</p>
        <h1>Capture a moment</h1>
        <p>Add your notes and photos, then save everything into your gallery.</p>
      </header>

      <form className="reflection-form" onSubmit={onSubmit}>
        <label className="reflection-field" htmlFor="reflection-title">
          <span>Title</span>
          <input
            id="reflection-title"
            type="text"
            maxLength={120}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="e.g. Evening Walk"
            disabled={isSaving}
          />
        </label>

        <label className="reflection-field" htmlFor="reflection-content">
          <span>Description</span>
          <textarea
            id="reflection-content"
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="What happened? How did it feel?"
            rows={5}
            disabled={isSaving}
          />
        </label>

        <div className="reflection-field">
          <span>Images</span>
          <ImageUploadGrid
            images={images}
            maxImages={maxImages}
            disabled={isSaving}
            onAddImages={onAddImages}
            onRemoveImage={onRemoveImage}
          />
        </div>

        {images.length > 0 ? (
          <div className="reflection-upload-summary" role="status" aria-live="polite">
            <p>{images.length} image(s) selected</p>
            <p>{Math.round((totalUploadSize / (1024 * 1024)) * 100) / 100} MB total</p>
            <ul>
              {images.map((image) => (
                <li key={image.id}>{image.file.name}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? <p className="reflection-form-status error">{error}</p> : null}
        {saveState === 'saved' ? <p className="reflection-form-status success">Saved successfully.</p> : null}

        <div className="reflection-form-actions">
          <button type="submit" className="reflection-submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Reflection'}
          </button>
          <Link to="/home" className="reflection-cancel-link">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}

export type { SaveState }
export default CreateReflectionForm
