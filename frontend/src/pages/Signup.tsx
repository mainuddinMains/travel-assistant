
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
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function Signup() {
  const { t } = useTranslation()
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
      setServerError(e?.message || t('auth.errors.generic'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-travel-neutral-lightest to-travel-neutral-light/20">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-end">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🌍</div>
          <h1 className="text-2xl font-heading font-bold mb-2 bg-gradient-to-r from-travel-primary to-travel-primaryLight bg-clip-text text-transparent">{t('auth.signupTitle')}</h1>
          <p className="text-sm text-travel-neutral/70">{t('auth.signupSubtitle')}</p>
        </div>
        {serverError && <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 animate-fade-in">{serverError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <TextField label={t('auth.nameLabel')} {...register('name')} error={errors.name && t('validation.name') as string} />
          <TextField label={t('auth.emailLabel')} type="email" {...register('email')} error={errors.email && t('validation.email') as string} />
          <PasswordField label={t('auth.passwordLabel')} {...register('password')} error={errors.password && t('validation.password') as string} />
          <button className="btn btn-primary w-full py-3 text-base" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('auth.creatingAccount')}
              </span>
            ) : (
              `🚀 ${t('auth.signupButton')}`
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-sm text-travel-neutral/70 mr-2">{t('auth.haveAccount')}</span>
          <Link className="link" to="/login">{t('auth.toLogin')}</Link>
        </div>
        <div className="mt-4 text-center">
          <Link className="link text-sm" to="/">🌐 {t('auth.languageLink')}</Link>
        </div>
      </div>
    </div>
  )
}
