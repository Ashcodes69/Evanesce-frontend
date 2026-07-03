import './globals.css'
import { Caveat, Space_Grotesk } from 'next/font/google'

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={caveat.variable}>
      <body>{children}</body>
    </html>
  )
}
