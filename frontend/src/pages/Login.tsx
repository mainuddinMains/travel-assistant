
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '../features/auth/schemas'
import { login } from '../features/auth/api'
import { TextField } from '../components/forms/TextField'
import { PasswordField } from '../components/forms/PasswordField'
import { useAuth } from '../app/providers/AuthProvider'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useState,useEffect } from 'react'

export function Login() {
  const { t } = useTranslation(['auth','validation','common'])
  const nav = useNavigate()
  const { login: doLogin, token  } = useAuth()
  const [serverError, setServerError] = useState<string>('')

  // Redirect if already authenticated
  useEffect(() => {
    if (token) {
      console.log('User already authenticated, redirecting to home...')
      nav('/home', { replace: true })
    }
  }, [token, nav])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginInput) => {
    setServerError('')
    try {
      const res = await login(data)
      console.log('Login successful:', res)
      
      // Update authentication state
      doLogin(res.user, res.access_token)
      
      // Force a re-render and then navigate
      await new Promise(resolve => setTimeout(resolve, 200))
      console.log('Navigating to home page...')
      nav('/home', { replace: true })
      
    } catch (e: any) {
      console.error('Login error:', e)
      setServerError(e?.message || t('auth:errors.invalidCreds'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4">{t('auth:loginTitle')}</h1>
        {serverError && <div className="mb-3 text-red-700">{serverError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField label={t('auth:name')} {...register('name')} error={errors.name && t('validation:name') as string} />
          <PasswordField label={t('auth:password')} {...register('password')} error={errors.password && t('validation:password') as string} />
          <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
            {t('auth:login')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <span className="text-sm mr-2">{t('auth:haveAccount')}</span>
          <Link className="link" to="/signup">{t('auth:toSignup')}</Link>
        </div>
        <div className="mt-4 text-center">
          <Link className="link" to="/">{t('Language Change')}</Link>
        </div>
      </div>
    </div>
  )
}
