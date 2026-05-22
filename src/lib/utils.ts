import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskPhone(phone: string): string {
  if (!phone) return ""
  // 010-1234-5678 → 010-****-5678
  const cleaned = phone.replace(/[^0-9]/g, "")
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-***-${cleaned.slice(6)}`
  }
  return phone.slice(0, 3) + "****" + phone.slice(-4)
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function getDDay(targetDate: string | Date | null): { label: string; status: "today" | "overdue" | "upcoming" | "completed" | "none" } {
  if (!targetDate) return { label: "-", status: "none" }
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diff === 0) return { label: "D-Day", status: "today" }
  if (diff < 0) return { label: `D+${Math.abs(diff)}`, status: "overdue" }
  return { label: `D-${diff}`, status: "upcoming" }
}
