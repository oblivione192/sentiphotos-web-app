import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthenticationApi from '../Objects/Api/AuthenticationApi';
import './Auth.css'



function Register() {
  const navigate = useNavigate() 

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Username, email, and password are required.')
      setStatus('')
      return
    }

    setLoading(true)
    setError('')
    setStatus('')

    try {
      const response = await AuthenticationApi.register(
         username.trim(), 
         email.trim(), 
         password
      )

      setStatus('Registration successful. Redirecting to login...')

      setTimeout(() => {
        navigate('/login')
      }, 800)
    } catch {
      setError('Connection issue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page" aria-label="Registration page">
      <header className="auth-header">
        <h1>Create Account</h1>
        <p>Start saving reflections with a secure account and your own personal feed.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="auth-status error">{error}</p> : null}
        {status ? <p className="auth-status success">{status}</p> : null}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  )
}

export default Register
