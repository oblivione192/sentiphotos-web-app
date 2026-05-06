import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CreateReflectionForm, { type SaveState } from '../Components/CreateReflectionForm'
import type { SelectedReflectionImage } from '../Components/ImageUploadGrid'
import ImageApi from '../Objects/Api/ImageApi'
import ReflectionApi from '../Objects/Api/ReflectionApi'
import { ReflectionModel } from '../Objects/Models/ReflectionModel'
import { ImageUploadPayloadModel } from '../Objects/Models/ImageUploadPayloadModel'
import EncryptionService from '../Services/Encryption'
import useProfile from '../Stores/Profile'

const MAX_REFLECTION_IMAGES = 9

function CreateReflection() {
  const navigate = useNavigate()
  const profile = useProfile()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<SelectedReflectionImage[]>([])
  const imagesRef = useRef<SelectedReflectionImage[]>([])
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const files = useMemo(() => {
    return images.map((image) => image.file)
  }, [images])

  const totalUploadSize = useMemo(() => {
    return files.reduce((total, file) => total + file.size, 0)
  }, [files])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  const handleAddImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (selectedFiles.length === 0) {
      return
    }

    const availableSlots = MAX_REFLECTION_IMAGES - images.length

    if (availableSlots <= 0) {
      return
    }

    const imagesToAdd = selectedFiles.slice(0, availableSlots).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setImages((currentImages) => [...currentImages, ...imagesToAdd])
  }

  const handleRemoveImage = (imageId: string) => {
    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId)

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }

      return currentImages.filter((image) => image.id !== imageId)
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!title.trim()) {
      setError('A title is required to create a reflection.')
      return
    }

    setError('')
    setSaveState('saving')

    try {
      const reflection = new ReflectionModel()
      reflection.title = title.trim()
      reflection.description = content.trim() || null

      // Use master key for encryption if enabled
      const masterKey = profile.masterKey ? profile.masterKey: undefined
    

      const createdReflection = await ReflectionApi.createReflection(
        reflection, 
        await EncryptionService.stringToCryptoKey(masterKey!)
      )

      if (!createdReflection.reflectionId) {
        throw new Error('Failed to create reflection')
      }

      if (files.length > 0) {
        const imagePayload = new ImageUploadPayloadModel()
        imagePayload.reflectionId = createdReflection.reflectionId
        imagePayload.images = files

        imagePayload.reflectionKey = await createdReflection.getReflectionKey( 
            await EncryptionService.stringToCryptoKey(masterKey!)
        ) 
        
      
        await ImageApi.uploadImages(imagePayload)

      }

      setSaveState('saved')
      navigate('/home')
    } catch(error) { 
      console.log(error); 
      setSaveState('idle')
      setError('Unable to save your reflection right now. Please try again.')
    }
  }

  return (
    <CreateReflectionForm
      title={title}
      content={content}
      images={images}
      maxImages={MAX_REFLECTION_IMAGES}
      totalUploadSize={totalUploadSize}
      error={error}
      saveState={saveState}
      onTitleChange={setTitle}
      onContentChange={setContent}
      onAddImages={handleAddImages}
      onRemoveImage={handleRemoveImage}
      onSubmit={handleSubmit}
    />
  )
}

export default CreateReflection
