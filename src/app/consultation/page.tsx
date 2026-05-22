"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ConsultationTarget, ConsultationCycleSettings, User } from "@/types"
import { DEFAULT_CYCLE_SETTINGS } from "@/lib/criteria"
import { getDDay } from "@/lib/utils"
import { SummaryCards } from "@/components/consultation/summary-cards"
import { DashboardStats } from "@/components/consultation/dashboard-stats"
import { UploadSection } from "@/components/consultation/upload-section"
import { TargetTable } from "@/components/consultation/target-table"
import { ConsultationDrawer } from "@/components/consultation/consultation-drawer"
import { FilterBar } from "@/components/consultation/filter-bar"
import { SettingsModal } from "@/components/consultation/settings-modal"
import { Button } from "@/components/ui/button"
import { Settings, LogOut, BookOpen, Download } from "lucide-react"
import * as XLSX from "xlsx"

export default function ConsultationPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [targets, setTargets] = useState<ConsultationTarget[]>([])
  const [cycleSettings, setCycleSettings] = useState<ConsultationCycleSettings>(DEFAULT_CYCLE_SETTINGS)
  const [selectedTarget, setSelectedTarget] = useState<ConsultationTarget | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUploadDate, setLastUploadDate] = useState<string | null>(null)

  // ?�터 ?�태
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [riskFilter, setRiskFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [sortBy, setSortBy] = useState("nextDate")

  // ?�증 ?�인
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        setUser(data.user)
      } catch {
        router.push("/login")
      }
    }
    checkAuth()
  }, [router])

  // ?�이??로드
  const loadData = useCallback(async () => {
    try {
      const [targetsRes, settingsRes, uploadsRes] = await Promise.all([
        fetch("/api/targets"),
        fetch("/api/settings"),
        fetch("/api/uploads"),
      ])

      if (targetsRes.ok) {
        const data = await targetsRes.json()
        setTargets(data.targets || [])
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setCycleSettings(data.settings)
      }
      if (uploadsRes.ok) {
        const data = await uploadsRes.json()
        if (data.history?.length > 0) {
          setLastUploadDate(data.history[0].uploadDate)
        }
      }
    } catch (error) {
      console.error("Data load error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  // ?�태 ?�동 ?�데?�트 (D-Day 계산)
  const targetsWithStatus = useMemo(() => {
    return targets.map(target => {
      if (target.status === "completed") return target
      if (!target.nextConsultationDate) return target

      const { status } = getDDay(target.nextConsultationDate)
      let newStatus = target.status
      if (status === "today") newStatus = "today"
      else if (status === "overdue") newStatus = "overdue"
      else if (status === "upcoming") newStatus = "scheduled"

      return { ...target, status: newStatus }
    })
  }, [targets])

  // ?�터�?& ?�렬
  const filteredTargets = useMemo(() => {
    let result = [...targetsWithStatus]

    // 검??
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.employeeId.toLowerCase().includes(q) ||
        t.phone.includes(q)
      )
    }

    // ?�태 ?�터 (진행�??�료)
    if (statusFilter) {
      result = result.filter(t => (t.progressStatus || "in_progress") === statusFilter)
    }

    // ?�험???�터
    if (riskFilter) {
      result = result.filter(t => t.riskLevel === riskFilter)
    }

    // ?�속/?�업???�터
    if (departmentFilter) {
      result = result.filter(t => t.branch === departmentFilter)
    }

    // ?�렬
    result.sort((a, b) => {
      switch (sortBy) {
        case "nextDate":
          if (!a.nextConsultationDate && !b.nextConsultationDate) return 0
          if (!a.nextConsultationDate) return 1
          if (!b.nextConsultationDate) return -1
          return new Date(a.nextConsultationDate).getTime() - new Date(b.nextConsultationDate).getTime()
        case "risk":
          const riskOrder: Record<string, number> = { elderly: 0, high: 1, moderate: 2, low: 3 }
          return (riskOrder[a.riskLevel] ?? 3) - (riskOrder[b.riskLevel] ?? 3)
        case "examDate":
          return new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
        case "name":
          return a.name.localeCompare(b.name, "ko")
        default:
          return 0
      }
    })

    return result
  }, [targetsWithStatus, searchQuery, statusFilter, riskFilter, departmentFilter, sortBy])

  // ?�약 ?�계
  const stats = useMemo(() => {
    const total = targetsWithStatus.length
    const elderly = targetsWithStatus.filter(t => t.riskLevel === "elderly").length
    const highRisk = targetsWithStatus.filter(t => t.riskLevel === "high").length
    const today = targetsWithStatus.filter(t => t.status === "today").length
    const completed = targetsWithStatus.filter(t => (t.progressStatus || "in_progress") === "completed").length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, elderly, highRisk, today, completed, completionRate }
  }, [targetsWithStatus])

  // ?�업??목록 (branch = ?�업?�명)
  const departments = useMemo(() => {
    const branches = new Set(targets.map(t => t.branch).filter(Boolean))
    return Array.from(branches).sort()
  }, [targets])

  // ?�?�자 ??��
  const handleDeleteTargets = async (ids: string[]) => {
    const res = await fetch("/api/targets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) {
      await loadData()
    }
  }

  const handleDeleteAll = async () => {
    const res = await fetch("/api/targets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteAll: true }),
    })
    if (res.ok) {
      await loadData()
    }
  }

  // 진행?�태 ?��? (진행�????�료)
  const handleToggleProgress = async (targetId: string, status: "not_started" | "in_progress" | "completed") => {
    const res = await fetch(`/api/targets/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressStatus: status }),
    })
    if (res.ok) {
      await loadData()
    }
  }

  // ?�음 ?�담??변�?
  const handleUpdateNextDate = async (targetId: string, date: string) => {
    const res = await fetch(`/api/targets/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextConsultationDate: date, status: "scheduled" }),
    })
    if (res.ok) {
      await loadData()
      const data = await res.json()
      setSelectedTarget(data.target)
    }
  }

  // 증빙?�료 ?�??
  const handleSaveEvidence = async (targetId: string, imageData: string, description: string) => {
    const res = await fetch(`/api/targets/${targetId}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageData, description }),
    })
    if (res.ok) {
      await loadData()
      const data = await res.json()
      setSelectedTarget(data.target)
    }
  }

  // ?�담 기록 ?�??
  const handleSaveRecord = async (targetId: string, record: Record<string, unknown>) => {
    const res = await fetch(`/api/targets/${targetId}/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    })

    if (res.ok) {
      await loadData()
      // ?�택???�?�자 갱신
      const data = await res.json()
      setSelectedTarget(data.target)
    }
  }

  // ?�정 ?�??
  const handleSaveSettings = async (settings: ConsultationCycleSettings) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    if (res.ok) {
      setCycleSettings(settings)
    }
  }

  // 로그?�웃
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    const rows: Record<string, string>[] = []
    for (const target of targetsWithStatus) {
      if (target.consultations.length === 0) {
        rows.push({
          "이름": target.name,
          "사번": target.employeeId,
          "상담일": "",
          "상담유형": "",
          "상담 내용": "",
        })
      } else {
        for (const c of target.consultations) {
          rows.push({
            "이름": target.name,
            "사번": target.employeeId,
            "상담일": c.consultationDate,
            "상담유형": c.consultationType === "first" ? "1차 상담" : c.consultationType === "second" ? "2차 상담" : "추적 상담",
            "상담 내용": c.consultationContent || "",
          })
        }
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "상담기록")
    XLSX.writeFile(wb, `상담기록_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">건강검진 유소견자 상담관리</h1>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/consultation/criteria")} className="text-gray-600 hidden sm:flex">
                <BookOpen className="h-4 w-4 mr-1" />
                관리 기준
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExcelDownload} className="text-gray-600 hidden sm:flex">
                <Download className="h-4 w-4 mr-1" />
                엑셀 다운
              </Button>
              <span className="text-sm text-gray-500 hidden sm:inline">
                {user?.name}님
              </span>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="설정">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="로그아웃">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 업로드 섹션 */}
        <UploadSection
          lastUploadDate={lastUploadDate}
          onUploadComplete={loadData}
          userName={user?.name || "admin"}
        />

        {/* 요약 카드 */}
        <SummaryCards
          totalTargets={stats.total}
          elderlyCount={stats.elderly}
          highRiskCount={stats.highRisk}
          todayCount={stats.today}
          completionRate={stats.completionRate}
        />

        {/* 건강관리 통계 대시보드 */}
        <DashboardStats targets={targetsWithStatus} />

        {/* 모바일 기준 버튼 */}
        <div className="sm:hidden">
          <Button variant="outline" size="sm" onClick={() => router.push("/consultation/criteria")} className="w-full">
            <BookOpen className="h-4 w-4 mr-1" />
            관리 기준 보기
          </Button>
        </div>

        {/* 필터 */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          departments={departments}
        />

        {/* 고령자 섹션 */}
        {(riskFilter === "" || riskFilter === "elderly") && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-purple-50">
              <p className="text-sm font-semibold text-purple-800">
                👴 고령자 (만 55세 이상)
                <span className="ml-2 font-normal text-purple-600">
                  {filteredTargets.filter(t => t.riskLevel === "elderly").length}명
                </span>
              </p>
            </div>
            <TargetTable
              targets={filteredTargets.filter(t => t.riskLevel === "elderly")}
              onSelectTarget={(target) => {
                setSelectedTarget(target)
                setDrawerOpen(true)
              }}
              onDeleteTargets={handleDeleteTargets}
              onDeleteAll={handleDeleteAll}
              onToggleProgress={handleToggleProgress}
            />
          </div>
        )}

        {/* 고위험군(고령제외) 섹션 */}
        {(riskFilter === "" || riskFilter === "high") && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-red-50">
              <p className="text-sm font-semibold text-red-800">
                ⚠️ 고위험군 (고령 제외)
                <span className="ml-2 font-normal text-red-600">
                  {filteredTargets.filter(t => t.riskLevel === "high").length}명
                </span>
              </p>
            </div>
            <TargetTable
              targets={filteredTargets.filter(t => t.riskLevel === "high")}
              onSelectTarget={(target) => {
                setSelectedTarget(target)
                setDrawerOpen(true)
              }}
              onDeleteTargets={handleDeleteTargets}
              onDeleteAll={handleDeleteAll}
              onToggleProgress={handleToggleProgress}
            />
          </div>
        )}
      </main>

      {/* 상담 상세 Drawer */}
      <ConsultationDrawer
        target={selectedTarget}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedTarget(null)
        }}
        onSaveRecord={handleSaveRecord}
        onUpdateNextDate={handleUpdateNextDate}
        onSaveEvidence={handleSaveEvidence}
        cycleSettings={cycleSettings}
        counselorName={user?.name || "관리자"}
      />

      {/* 설정 모달 */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={cycleSettings}
        onSave={handleSaveSettings}
      />
    </div>
  )
}
