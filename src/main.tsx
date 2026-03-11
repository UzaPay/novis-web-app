import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'
import './index.css'
import { Toaster } from 'sonner'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
})

// Detect system dark mode preference
const isDarkMode =
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

if (isDarkMode) {
  document.documentElement.classList.add('dark')
}

// Listen for changes
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', e => {
    if (e.matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <App />
        <Toaster richColors position='top-right' />
      </BrowserRouter>
     {import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' && <ReactQueryDevtools />}
    </QueryClientProvider>
  </React.StrictMode>
)
