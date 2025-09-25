
import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  email: z.string().email(),
  password: z.string().min(8)
})

export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
export type LoginInput = z.infer<typeof loginSchema>
