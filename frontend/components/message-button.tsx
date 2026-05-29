"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { IconMessages } from "@/components/icons/TmIcons"
import { toast } from "sonner"
import React from "react"

interface Props {
  userId: string
  className?: string
}

export default function MessageButton({ userId, className }: Props) {
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/session')
      if (!res.ok) {
        // not logged in -> redirect to login
        router.push('/login')
        return
      }

      // has session -> navigate to messages with query
      router.push(`/messages?userId=${userId}`)
    } catch (err) {
      console.error(err)
      toast.error('No se pudo abrir el chat. Intenta de nuevo.')
    }
  }

  return (
    <Button size="lg" className={className} onClick={handleClick} style={{ backgroundColor: '#C4783A', color: '#FDFBD4', fontFamily: 'var(--font-main)' }}>
      <IconMessages className="mr-2 h-4 w-4" />
      Enviar Mensaje
    </Button>
  )
}
