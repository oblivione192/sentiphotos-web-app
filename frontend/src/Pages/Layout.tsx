import { Outlet } from 'react-router-dom'
import '../App.css'

function Layout() {
	return (
		<div className="app-shell">
			<Outlet />
		</div>
	)
}

export default Layout