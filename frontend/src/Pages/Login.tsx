import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import AuthenticationApi from '../Objects/Api/AuthenticationApi'; 
import useProfile from '../Stores/Profile'; 
import EncryptionService from '../Services/Encryption';
import './Auth.css'

type LoginResponse = {
  token?: string
  message?: string
  error?: string
}

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false) 

  const profile = useProfile(); 

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.')
      return
    }

    setError('')
    setLoading(true)

    try {
      
      const response = await AuthenticationApi.login(
         username, 
         password 
      );     

      const masterKey =  response.masterKey; 



      profile.setMasterKey(await EncryptionService.cryptoKeyToString(masterKey!)); 


      navigate('/home'); 

    } catch (error: any){
      setError(error.message); 
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page" aria-label="Login page">
      <header className="auth-header">
        <h1>Welcome Back</h1>
        <p>Sign in to continue organizing your reflections and image moments.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="auth-status error">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="auth-footer">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </main>
  )
}

export default Login
