
import { forwardRef, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TF({ label, error, className, ...props }, ref) {
  return (
    <div>
      <label className="label">{label}</label>
      <input ref={ref} className={clsx('input', className, error && 'border-red-500')} {...props} aria-invalid={!!error} />
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
})
