import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "건강검진 유소견자 상담관리",
  description: "안전보건팀 건강검진 유소견자 전화상담 관리 시스템",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
