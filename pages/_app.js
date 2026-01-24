import '../styles/globals.css'
import { LanguageProvider } from '../contexts/LanguageContext'
import ErrorBoundary from '../components/ErrorBoundary'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    // Track initial page visit
    trackPageVisit(router.asPath)

    // Track route changes
    const handleRouteChange = (url) => {
      trackPageVisit(url)
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  const trackPageVisit = async (page) => {
    try {
      // Only track in production to avoid spam during development
      if (process.env.NODE_ENV !== 'production') {
        console.log('📊 [DEV] Page visit tracked:', page)
        return
      }

      const visitData = {
        page: page,
        referrer: document.referrer || 'Direct visit',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }

      console.log('📊 [PROD] Tracking visit:', page)

      // Send tracking data
      fetch('/api/track-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
      })
      .then(response => response.json())
      .then(data => {
        console.log('✅ Track response:', data)
        if (data.success) {
          console.log('📧 Email notification sent successfully')
        } else {
          console.warn('⚠️ Email notification failed:', data.error)
        }
      })
      .catch(err => {
        console.error('❌ Failed to track visit:', err)
      })
    } catch (error) {
      console.error('❌ Error tracking visit:', error)
    }
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </ErrorBoundary>
  )
}
