"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Calendar, CheckCircle, UserCheck, UserRound } from "lucide-react"

interface SummaryCardsProps {
  totalTargets: number
  elderlyCount: number
  highRiskCount: number
  todayCount: number
  completionRate: number
}

export function SummaryCards({
  totalTargets,
  elderlyCount,
  highRiskCount,
  todayCount,
  completionRate,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "상담 대상자",
      value: totalTargets,
      icon: UserCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "고령자",
      value: elderlyCount,
      icon: UserRound,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "고위험(고령제외)",
      value: highRiskCount,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "오늘 상담 대상",
      value: todayCount,
      icon: Calendar,
      color: "text-blue-800",
      bg: "bg-blue-100",
    },
    {
      title: "상담 완료율",
      value: `${completionRate}%`,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.title}</p>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
