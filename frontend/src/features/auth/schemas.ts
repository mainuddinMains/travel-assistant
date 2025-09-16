
import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().email(),
  age: z.coerce.number().int().min(13).max(120),
  gender: z.enum(['female','male','nonbinary','na']),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/),
  agree: z.literal(true)
})

export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  name: z.string().trim().min(2).max(50),
  password: z.string().min(8)
})
export type LoginInput = z.infer<typeof loginSchema>
