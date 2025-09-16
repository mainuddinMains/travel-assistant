
import { forwardRef, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, Props>(function SL({ label, error, options, className, ...props }, ref) {
  return (
    <div>
      <label className="label">{label}</label>
      <select ref={ref} className={clsx('input', className, error && 'border-red-500')} {...props} aria-invalid={!!error}>
        <option value="">{/* placeholder blank */}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
})
