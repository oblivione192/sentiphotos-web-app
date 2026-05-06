import type { ReflectionCard } from '../Components/types'
import placeholderImage from '../assets/reflection-placeholder.svg'
import ImageApi from '../Objects/Api/ImageApi'
import ReflectionApi from '../Objects/Api/ReflectionApi'
import { ImageFilterModel } from '../Objects/Filters/ImageFilter'
import { ReflectionFilterModel } from '../Objects/Filters/ReflectionFilter'
import { ReflectionModel } from '../Objects/Models/ReflectionModel'
import EncryptionService from '../Services/Encryption'
import useProfile from '../Stores/Profile'
import blobToUrl from '../Objects/Helpers/BlobToUrl'

type DecryptedReflectionMetadata = {
  title?: string | null
  description?: string | null
}

type DecryptedReflection = {
  metadata: DecryptedReflectionMetadata
  reflectionKey: CryptoKey | null
}

type ReflectionWithId = ReflectionModel & { reflectionId: string }

type EncryptedReflection = ReflectionWithId & {
  encryptedMetadata: string
  metadataNonce: string
  encryptedReflectionKey: string
  reflectionKeyNonce: string
}

type ReflectionFeedAccess = {
  userId: string
  masterKey: CryptoKey
}

function hasReflectionId(reflection: ReflectionModel): reflection is ReflectionWithId {
  return Boolean(reflection.reflectionId)
}

function hasEncryptedReflectionMetadata(reflection: ReflectionWithId): reflection is EncryptedReflection {
  return Boolean(
    reflection.encryptedMetadata &&
      reflection.metadataNonce &&
      reflection.encryptedReflectionKey &&
      reflection.reflectionKeyNonce,
  )
}

async function getReflectionFeedAccess(): Promise<ReflectionFeedAccess> {
  let profile = useProfile.getState()

  if (!profile.userId) {
    await profile.fetchProfile()
    profile = useProfile.getState()
  }

  if (!profile.userId) {
    throw new Error('Unable to resolve profile information')
  }

  if (!profile.masterKey) {
    throw new Error('Unable to decrypt reflections without a master key')
  }

  return {
    userId: profile.userId,
    masterKey: await EncryptionService.stringToCryptoKey(profile.masterKey),
  }
}

async function decryptReflection(
  reflection: ReflectionWithId,
  masterKey: CryptoKey,
): Promise<DecryptedReflection> {
  if (!hasEncryptedReflectionMetadata(reflection)) {
    return {
      metadata: {
        title: reflection.title,
        description: reflection.description,
      },
      reflectionKey: null,
    }
  }

  const decrypted = await EncryptionService.decryptCollection(masterKey, {
    encryptedReflectionKey: EncryptionService.fromBase64(reflection.encryptedReflectionKey),
    reflectionKeyNonce: EncryptionService.fromBase64(reflection.reflectionKeyNonce),
    encryptedMetadata: EncryptionService.fromBase64(reflection.encryptedMetadata),
    metadataNonce: EncryptionService.fromBase64(reflection.metadataNonce),
  })

  return {
    metadata: decrypted.metadata as DecryptedReflectionMetadata,
    reflectionKey: decrypted.reflectionKey,
  }
}

function normalizeReflectionTitle(metadata: DecryptedReflectionMetadata): string {
  if (metadata.title?.trim()) {
    return metadata.title.trim()
  }

  return 'Untitled Reflection'
}

function getReflectionMood(metadata: DecryptedReflectionMetadata): string {
  if (metadata.description?.trim()) {
    return 'Expressive'
  }

  return 'Reflective'
}

async function getReflectionImages(userId: string, reflectionId: string) {
  const imageFilter = new ImageFilterModel()
  imageFilter.userId = userId
  imageFilter.reflectionId = reflectionId
  imageFilter.page = 1
  imageFilter.limit = 20

  try {
    return await ImageApi.indexImages(imageFilter)
  } catch {
    return []
  }
}

async function getReflectionImageUrl(
  reflectionKey: CryptoKey | null,
  images: Awaited<ReturnType<typeof ImageApi.indexImages>>,
): Promise<string | null> {
  if (!reflectionKey || !images[0]) {
    return null
  }

  try {
    const decryptedImage = await ImageApi.decryptImage(reflectionKey, images[0])
    return blobToUrl(decryptedImage, images[0].mimeType ? images[0].mimeType: 'text/plain'); 
  } catch {
    return null
  }
}

async function toReflectionCard(
  reflection: ReflectionWithId,
  userId: string,
  masterKey: CryptoKey,
): Promise<ReflectionCard> {
  const decryptedReflection = await decryptReflection(reflection, masterKey)
  const images = await getReflectionImages(userId, reflection.reflectionId)
  const imageUrl = await getReflectionImageUrl(decryptedReflection.reflectionKey, images)

  return {
    id: reflection.reflectionId,
    title: normalizeReflectionTitle(decryptedReflection.metadata),
    mood: getReflectionMood(decryptedReflection.metadata),
    photos: images.length,
    image: imageUrl ?? placeholderImage,
  }
}

export default async function fetchReflectionFeed(): Promise<ReflectionCard[]> {
  const { userId, masterKey } = await getReflectionFeedAccess()

  const reflectionFilter = new ReflectionFilterModel()
  reflectionFilter.userId = userId
  reflectionFilter.page = 1
  reflectionFilter.limit = 50

  const reflections = await ReflectionApi.getAllReflections(reflectionFilter)
  const reflectionsWithIds = reflections.filter(hasReflectionId)

  return Promise.all(
    reflectionsWithIds.map((reflection) => toReflectionCard(reflection, userId, masterKey)),
  )
}
