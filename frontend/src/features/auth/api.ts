
import { api } from '../../lib/http'
import type { SignupInput, LoginInput } from './schemas'

export async function signup(data: SignupInput) {
  return api('/auth/signup', { method: 'POST', body: data, skipAuth: true })
}

export async function login(data: LoginInput) {
  return api('/auth/login', { method: 'POST', body: data, skipAuth: true })
}

export async function getCurrentUser(token: string) {
  return api('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function logout() {
  return api('/auth/signout', { method: 'POST' })
}