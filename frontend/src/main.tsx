
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/index.css'
import './features/i18n'
import { router } from './app/router'
import { AuthProvider } from './app/providers/AuthProvider'
import { enableMSW } from './mocks/enable'

enableMSW()

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
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)

