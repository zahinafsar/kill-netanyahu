"use client"

import { useEffect, useState } from "react"
import KillNetanyahu from "@/components/kill-netanyahu"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <main className="w-full h-screen overflow-hidden bg-sky-100">
      <KillNetanyahu />
    </main>
  )
}

