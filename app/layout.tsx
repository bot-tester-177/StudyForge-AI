// app/layout.tsx
export const metadata = {
  title: 'StudyForge AI',
  description: 'AI-Powered Study Roadmap Generator',
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