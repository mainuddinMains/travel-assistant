
import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { clsx } from 'clsx'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const PasswordField = forwardRef<HTMLInputElement, Props>(function PF({ label, error, className, ...props }, ref) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input ref={ref} type={show ? 'text' : 'password'} className={clsx('input pr-10', className, error && 'border-red-500')} {...props} aria-invalid={!!error} />
        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-sm underline" onClick={() => setShow(s => !s)}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
})
