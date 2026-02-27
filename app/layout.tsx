// app/layout.tsx
import './globals.css' // optional, if you have global styles

export const metadata = {
  title: 'StudyForge AI',
  description: 'AI Study Roadmap Generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}