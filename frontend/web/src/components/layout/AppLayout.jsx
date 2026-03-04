import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-obsidian-950 bg-grid-obsidian bg-grid">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#12122a',
            border: '1px solid #2a2a3a',
            color: '#e2e8f0',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#12122a' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#12122a' } },
        }}
      />
    </div>
  )
}
