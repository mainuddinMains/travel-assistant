
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/index.css'
import './i18n'
import { router } from './app/router'
import { AuthProvider } from './app/providers/AuthProvider'
// import { enableMSW } from './mocks/enable'

// enableMSW() // Disabled to use real backend

const client = new QueryClient()

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <QueryClientProvider client={client}>
//       <AuthProvider>
//         <RouterProvider router={router} />
//       </AuthProvider>
//     </QueryClientProvider>
//   </React.StrictMode>
// )


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <AuthProvider>
        <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center text-travel-neutral">Loading...</div>}>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </React.Suspense>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)

