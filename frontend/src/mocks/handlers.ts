
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json() as any
    if (body.name?.toLowerCase() === 'existing') {
      return HttpResponse.json({ code: 'USER_EXISTS', message: 'User already exists' }, { status: 409 })
    }
    return HttpResponse.json({ user: { id: 'u_123', name: body.name }, token: 'mock-token-abc' }, { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any
    if (body.password !== 'abc12345') {
      return HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }, { status: 401 })
    }
    return HttpResponse.json({ user: { id: 'u_123', name: body.name }, token: 'mock-token-abc' }, { status: 200 })
  })
]
