
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupInput } from '../features/auth/schemas'
import { signup } from '../features/auth/api'
import { TextField } from '../components/forms/TextField'
import { PasswordField } from '../components/forms/PasswordField'
import { useAuth } from '../app/providers/AuthProvider'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function Signup() {
  const { t } = useTranslation(['auth','validation','common'])
  const nav = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string>('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema)
  })

  const onSubmit = async (data: SignupInput) => {
    setServerError('')
    try {
      const res = await signup(data)
      login(res.user, res.access_token)
      nav('/home')
    } catch (e: any) {
      setServerError(e?.message || t('auth:errors.generic'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4">{t('auth:signupTitle')}</h1>
        {serverError && <div className="mb-3 text-red-700">{serverError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField label={t('auth:name')} {...register('name')} error={errors.name && t('validation:name') as string} />
          <TextField label={t('auth:email')} type="email" {...register('email')} error={errors.email && t('validation:email') as string} />
          <PasswordField label={t('auth:password')} {...register('password')} error={errors.password && t('validation:password') as string} />
          <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
            {t('auth:createAccount')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <span className="text-sm mr-2">{t('auth:haveAccount')}</span>
          <Link className="link" to="/login">{t('auth:toLogin')}</Link>
        </div>
        <div className="mt-4 text-center">
          <Link className="link" to="/">{t('language.change')}</Link>
        </div>
      </div>
    </div>
  )
}
