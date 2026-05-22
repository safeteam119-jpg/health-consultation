"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-2xl bg-white shadow-xl transition-transform overflow-y-auto",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </>
  )
}
