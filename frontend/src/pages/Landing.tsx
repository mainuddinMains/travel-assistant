import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../app/providers/AuthProvider'
import { Header } from '../components/landing/Header'
import { Hero } from '../components/landing/Hero'
import { Features } from '../components/landing/Features'
import { Destinations } from '../components/landing/Destinations'
import { Steps } from '../components/landing/Steps'
import { Testimonials } from '../components/landing/Testimonials'
import { Partners } from '../components/landing/Partners'
import { Subscription } from '../components/landing/Subscription'
import { Footer } from '../components/landing/Footer'

export function Landing() {
  const nav = useNavigate()
  const { token } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      nav('/home', { replace: true })
    }
  }, [token, nav])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <Destinations />
        <Steps />
        <Testimonials />
        <Partners />
        <Subscription />
      </main>
      <Footer />
    </div>
  )
}

