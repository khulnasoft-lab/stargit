"use client"

import { useEffect, useState } from "react"

export function isMobile() {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return mobile
}
