import type { ChangeEvent } from 'react'

import { PlusIcon, TrashIcon } from './Icons'

interface SelectedReflectionImage {
  id: string
  file: File
  previewUrl: string
}

interface ImageUploadGridProps {
  images: SelectedReflectionImage[]
  maxImages: number
  disabled: boolean
  onAddImages: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (imageId: string) => void
}

function ImageUploadGrid({
  images,
  maxImages,
  disabled,
  onAddImages,
  onRemoveImage,
}: ImageUploadGridProps) {
  const activeAddSlotIndex = images.length < maxImages ? images.length : -1
  const slots = Array.from({ length: maxImages }, (_, index) => images[index] ?? null)

  return (
    <div className="image-upload-grid" aria-label="Reflection images">
      {slots.map((image, index) => {
        if (image) {
          return (
            <div className="image-upload-slot filled" key={image.id}>
              <img src={image.previewUrl} alt={image.file.name} />
              <button
                className="image-slot-remove"
                type="button"
                onClick={() => onRemoveImage(image.id)}
                disabled={disabled}
                aria-label={`Remove ${image.file.name}`}
              >
                <TrashIcon />
              </button>
            </div>
          )
        }

        if (index === activeAddSlotIndex) {
          return (
            <label className="image-upload-slot add" key={`add-slot-${index}`}>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onAddImages}
                disabled={disabled}
              />
              <PlusIcon />
            </label>
          )
        }

        return <div className="image-upload-slot empty" key={`empty-slot-${index}`} aria-hidden="true" />
      })}
    </div>
  )
}

export type { SelectedReflectionImage }
export default ImageUploadGrid
