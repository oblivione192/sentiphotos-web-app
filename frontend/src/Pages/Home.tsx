import { useCallback, useEffect, useState } from 'react'

import DeleteReflectionModal from '../Components/DeleteReflectionModal'
import ReflectionFeedPanel from '../Components/ReflectionFeedPanel'
import type { ReflectionCard } from '../Components/types'
import ReflectionApi from '../Objects/Api/ReflectionApi'
import fetchReflectionFeed  from './reflectionFeed'

function Home() {
	const [reflections, setReflections] = useState<ReflectionCard[]>([])
	const [selectedReflectionId, setSelectedReflectionId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [reflectionToDelete, setReflectionToDelete] = useState<ReflectionCard | null>(null)
	const [deletePending, setDeletePending] = useState(false)
	const [deleteError, setDeleteError] = useState('')

	const loadReflections = useCallback(async () => {
		setLoading(true)
		setError('')

		try {
			const feed = await fetchReflectionFeed()
			setReflections(feed)
			setSelectedReflectionId((previousId) => {
				if (previousId && feed.some((reflection) => reflection.id === previousId)) {
					return previousId
				}

				return feed[0]?.id ?? null
			})
		} catch (error) {
			console.error(error)
			setReflections([])
			setSelectedReflectionId(null)
			setError('Unable to load reflections. Please try again.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadReflections()
	}, [loadReflections])

	const handleRequestDeleteReflection = (reflection: ReflectionCard) => {
		setDeleteError('')
		setReflectionToDelete(reflection)
	}

	const handleCancelDeleteReflection = () => {
		if (deletePending) {
			return
		}

		setDeleteError('')
		setReflectionToDelete(null)
	}

	const handleConfirmDeleteReflection = async () => {
		if (!reflectionToDelete) {
			return
		}

		setDeletePending(true)
		setDeleteError('')

		try {
			const deletedReflectionId = reflectionToDelete.id
			const nextReflections = reflections.filter((reflection) => reflection.id !== deletedReflectionId)

			await ReflectionApi.deleteReflection(deletedReflectionId)
			setReflections(nextReflections)
			setSelectedReflectionId((currentSelectedId) => {
				if (currentSelectedId !== deletedReflectionId) {
					return currentSelectedId
				}

				return nextReflections[0]?.id ?? null
			})
			setReflectionToDelete(null)
		} catch {
			setDeleteError('Unable to delete this reflection right now. Please try again.')
		} finally {
			setDeletePending(false)
		}
	}

	return (
		<>
			<ReflectionFeedPanel
				ariaLabel="Reflections"
				loading={loading}
				loadingText="Loading reflections..."
				error={error}
				reflections={reflections}
				selectedReflectionId={selectedReflectionId}
				onSelectReflection={setSelectedReflectionId}
				onRequestDeleteReflection={handleRequestDeleteReflection}
				onRetry={() => void loadReflections()}
				emptyTitle="No reflections yet"
				emptyDescription="Create your first reflection to start building your gallery."
			/>
			<DeleteReflectionModal
				reflection={reflectionToDelete}
				deleting={deletePending}
				error={deleteError}
				onCancel={handleCancelDeleteReflection}
				onConfirm={() => void handleConfirmDeleteReflection()}
			/>
		</>
	)
}

export default Home
