
import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const PasswordField = forwardRef<HTMLInputElement, Props>(function PF({ label, error, className, ...props }, ref) {
  const [show, setShow] = useState(false)
  const { t } = useTranslation()
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input ref={ref} type={show ? 'text' : 'password'} className={clsx('input pr-12', className, error && 'border-travel-accent')} {...props} aria-invalid={!!error} />
        <button 
          type="button" 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-travel-primary hover:text-travel-primaryLight transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-travel-primary/20 rounded px-2 py-1" 
          onClick={() => setShow(s => !s)}
        >
          {show ? t('password.hide') : t('password.show')}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
})
