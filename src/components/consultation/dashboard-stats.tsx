"use client"

import { ConsultationTarget } from "@/types"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardStatsProps {
  targets: ConsultationTarget[]
}

export function DashboardStats({ targets }: DashboardStatsProps) {
  const elderly = targets.filter(t => t.riskLevel === "elderly")
  const highRisk = targets.filter(t => t.riskLevel === "high")
  const total = targets.length

  // 관리 실시 인원 (진행중 수)
  const elderlyInProgress = elderly.filter(t => (t.progressStatus || "in_progress") === "in_progress").length
  const highRiskInProgress = highRisk.filter(t => (t.progressStatus || "in_progress") === "in_progress").length
  const totalInProgress = elderlyInProgress + highRiskInProgress

  // 관리 완료 인원 (완료 수)
  const elderlyCompleted = elderly.filter(t => t.progressStatus === "completed").length
  const highRiskCompleted = highRisk.filter(t => t.progressStatus === "completed").length
  const totalCompleted = elderlyCompleted + highRiskCompleted

  // 비율 계산
  const pct = (n: number, d: number) => d > 0 ? (n / d * 100).toFixed(2) : "0"

  const sections: { title: string; color: string; rows: { label: string; value: number; pct?: string; bold?: boolean }[] }[] = [
    {
      title: "관리 대상자",
      color: "bg-blue-100 text-blue-800",
      rows: [
        { label: "고령자", value: elderly.length },
        { label: "고위험군", value: highRisk.length },
        { label: "전체", value: total, bold: true },
      ]
    },
    {
      title: "관리 실시(진행중) / 비율",
      color: "bg-yellow-100 text-yellow-800",
      rows: [
        { label: "고령자", value: elderlyInProgress, pct: pct(elderlyInProgress, elderly.length) },
        { label: "고위험군", value: highRiskInProgress, pct: pct(highRiskInProgress, highRisk.length) },
        { label: "전체", value: totalInProgress, pct: pct(totalInProgress, total), bold: true },
      ]
    },
    {
      title: "관리 완료 / 비율",
      color: "bg-green-100 text-green-800",
      rows: [
        { label: "고령자", value: elderlyCompleted, pct: pct(elderlyCompleted, elderly.length) },
        { label: "고위험군", value: highRiskCompleted, pct: pct(highRiskCompleted, highRisk.length) },
        { label: "전체", value: totalCompleted, pct: pct(totalCompleted, total), bold: true },
      ]
    },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">건강관리 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sections.map((section) => (
            <div key={section.title} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className={`px-3 py-1.5 text-xs font-medium ${section.color}`}>
                {section.title}
              </div>
              <div className="px-3 py-2 space-y-1">
                {section.rows.map((row) => (
                  <div key={row.label} className={`flex justify-between text-xs ${row.bold ? "font-semibold text-gray-900 border-t pt-1 mt-1" : "text-gray-600"}`}>
                    <span>{row.label}</span>
                    <span>
                      {row.value}
                      {row.pct !== undefined && <span className="text-gray-400 ml-1">({row.pct}%)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-400 space-y-0.5">
          <p>• 관리 실시율 = 진행중 수 / 전체 관리 대상자</p>
          <p>• 관리 완료율 = 완료 수 / 전체 관리 대상자</p>
        </div>
      </CardContent>
    </Card>
  )
}
