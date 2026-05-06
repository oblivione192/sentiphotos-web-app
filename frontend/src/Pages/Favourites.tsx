import { useCallback, useEffect, useMemo, useState } from 'react'

import DeleteReflectionModal from '../Components/DeleteReflectionModal'
import ReflectionFeedPanel from '../Components/ReflectionFeedPanel'
import type { ReflectionCard } from '../Components/types'
import ReflectionApi from '../Objects/Api/ReflectionApi'
import fetchReflectionFeed  from './reflectionFeed'

function Favourites() {
	const [reflections, setReflections] = useState<ReflectionCard[]>([])
	const [selectedReflectionId, setSelectedReflectionId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [reflectionToDelete, setReflectionToDelete] = useState<ReflectionCard | null>(null)
	const [deletePending, setDeletePending] = useState(false)
	const [deleteError, setDeleteError] = useState('')

	const favourites = useMemo(() => {
		return reflections.filter((reflection) => reflection.photos > 0)
	}, [reflections])

	const loadFavourites = useCallback(async () => {
		setLoading(true)
		setError('')

		try {
			const feed = await fetchReflectionFeed()
			setReflections(feed)
		} catch {
			setReflections([])
			setError('Unable to load favourites right now. Please try again.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadFavourites()
	}, [loadFavourites])

	useEffect(() => {
		setSelectedReflectionId((previousId) => {
			if (previousId && favourites.some((reflection) => reflection.id === previousId)) {
				return previousId
			}

			return favourites[0]?.id ?? null
		})
	}, [favourites])

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
			await ReflectionApi.deleteReflection(reflectionToDelete.id)
			setReflections((currentReflections) =>
				currentReflections.filter((reflection) => reflection.id !== reflectionToDelete.id),
			)
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
				ariaLabel="Favourites"
				loading={loading}
				loadingText="Loading favourites..."
				error={error}
				reflections={favourites}
				selectedReflectionId={selectedReflectionId}
				onSelectReflection={setSelectedReflectionId}
				onRequestDeleteReflection={handleRequestDeleteReflection}
				onRetry={() => void loadFavourites()}
				emptyTitle="No favourites yet"
				emptyDescription="Reflections with photos will appear here."
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

export default Favourites
