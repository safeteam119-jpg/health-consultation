"use client"

import { useState } from "react"
import { ConsultationTarget } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ChevronRight, Trash2, CheckSquare, Square, XSquare } from "lucide-react"

interface TargetTableProps {
  targets: ConsultationTarget[]
  onSelectTarget: (target: ConsultationTarget) => void
  onDeleteTargets: (ids: string[]) => void
  onDeleteAll: () => void
  onToggleProgress?: (targetId: string, status: "not_started" | "in_progress" | "completed") => void
}

function getStatusBadge(target: ConsultationTarget, onToggle?: (id: string, status: "not_started" | "in_progress" | "completed") => void) {
  // 진행 상태
  const progress = (target.progressStatus || "not_started") as "not_started" | "in_progress" | "completed"
  
  // 다음 상태 순환: 미진행 → 진행중 → 완료 → 미진행
  const nextStatus = (): "not_started" | "in_progress" | "completed" => {
    switch (progress) {
      case "not_started": return "in_progress"
      case "in_progress": return "completed"
      case "completed": return "not_started"
    }
  }

  const label = progress === "completed" ? "완료" : progress === "in_progress" ? "진행중" : "미진행"
  const variant = progress === "completed" ? "completed" : progress === "in_progress" ? "scheduled" : "pending"

  // 상담 단계
  const phase = target.consultationPhase || "none"
  let phaseLabel = ""
  switch (phase) {
    case "first_done": phaseLabel = "1차 상담완료"; break
    case "second_done": phaseLabel = "2차 상담완료"; break
    case "unreachable": phaseLabel = "연락불가"; break
    default: phaseLabel = ""; break
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (onToggle) onToggle(target.id, nextStatus())
        }}
        title="클릭하여 상태 변경"
      >
        <Badge variant={variant}>
          {label}
        </Badge>
      </button>
      {phaseLabel && (
        <Badge variant={phase === "unreachable" ? "overdue" : phase === "second_done" ? "completed" : "moderate"}>
          {phaseLabel}
        </Badge>
      )}
    </div>
  )
}

function getRiskBadge(riskLevel: string) {
  switch (riskLevel) {
    case "elderly":
      return <Badge variant="high">고령자</Badge>
    case "high":
      return <Badge variant="high">고위험</Badge>
    case "moderate":
      return <Badge variant="moderate">일반관리</Badge>
    case "low":
      return <Badge variant="low">확인필요</Badge>
    default:
      return <Badge variant="pending">{riskLevel}</Badge>
  }
}

export function TargetTable({ targets, onSelectTarget, onDeleteTargets, onDeleteAll, onToggleProgress }: TargetTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteMode, setDeleteMode] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === targets.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(targets.map(t => t.id)))
    }
  }

  const handleDelete = () => {
    if (selectedIds.size === 0) return
    if (confirm(`선택한 ${selectedIds.size}명을 삭제하시겠습니까?`)) {
      onDeleteTargets(Array.from(selectedIds))
      setSelectedIds(new Set())
      setDeleteMode(false)
    }
  }

  const handleDeleteAll = () => {
    if (confirm(`전체 ${targets.length}명을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      onDeleteAll()
      setSelectedIds(new Set())
      setDeleteMode(false)
    }
  }

  if (targets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">상담 대상자가 없습니다.</p>
        <p className="text-sm mt-2">건강검진 결과 엑셀을 업로드해주세요.</p>
      </div>
    )
  }

  return (
    <>
      {/* 삭제 모드 컨트롤 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
        {!deleteMode ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteMode(true)}
            className="text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            삭제
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedIds.size === targets.length ? (
                <XSquare className="h-4 w-4 mr-1" />
              ) : (
                <CheckSquare className="h-4 w-4 mr-1" />
              )}
              {selectedIds.size === targets.length ? "전체 해제" : "전체 선택"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={selectedIds.size === 0}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              선택 삭제 ({selectedIds.size})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              전체 삭제
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDeleteMode(false); setSelectedIds(new Set()) }}
            >
              취소
            </Button>
          </>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {deleteMode && (
                <th className="py-3 px-3 w-10">
                  <button onClick={selectAll} className="text-gray-400 hover:text-gray-600">
                    {selectedIds.size === targets.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
              )}
              <th className="text-left py-3 px-4 font-medium text-gray-600">성명</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">사번</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">생년월일</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">사업장</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">연락처</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">유소견 항목</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">위험도</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">상담 예정일</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
              {!deleteMode && <th className="py-3 px-4"></th>}
            </tr>
          </thead>
          <tbody>
            {targets.map((target) => (
              <tr
                key={target.id}
                className={`border-b border-gray-100 transition-colors ${
                  deleteMode
                    ? selectedIds.has(target.id) ? "bg-red-50" : "hover:bg-gray-50"
                    : "hover:bg-blue-50/50 cursor-pointer"
                }`}
                onClick={() => {
                  if (deleteMode) {
                    toggleSelect(target.id)
                  } else {
                    onSelectTarget(target)
                  }
                }}
              >
                {deleteMode && (
                  <td className="py-3 px-3">
                    {selectedIds.has(target.id) ? (
                      <CheckSquare className="h-4 w-4 text-red-500" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                )}
                <td className="py-3 px-4 font-medium text-gray-900">{target.name}</td>
                <td className="py-3 px-4 text-gray-600">{target.employeeId}</td>
                <td className="py-3 px-4 text-gray-600">{target.birthDate || "-"}</td>
                <td className="py-3 px-4 text-gray-600">
                  {target.branch || target.department}
                </td>
                <td className="py-3 px-4 text-gray-600">{target.phone}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {target.findingsItems.map((item, i) => (
                      <span
                        key={i}
                        className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">{getRiskBadge(target.riskLevel)}</td>
                <td className="py-3 px-4 text-gray-600">
                  {target.nextConsultationDate ? formatDate(target.nextConsultationDate) : "-"}
                </td>
                <td className="py-3 px-4">{getStatusBadge(target, onToggleProgress)}</td>
                {!deleteMode && (
                  <td className="py-3 px-4">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3 p-4">
        {targets.map((target) => (
          <div
            key={target.id}
            className={`border rounded-xl p-4 transition-shadow cursor-pointer bg-white ${
              deleteMode && selectedIds.has(target.id)
                ? "border-red-300 bg-red-50"
                : "border-gray-200 hover:shadow-md"
            }`}
            onClick={() => {
              if (deleteMode) {
                toggleSelect(target.id)
              } else {
                onSelectTarget(target)
              }
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {deleteMode && (
                  selectedIds.has(target.id) ? (
                    <CheckSquare className="h-4 w-4 text-red-500 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-300 shrink-0" />
                  )
                )}
                <div>
                  <p className="font-medium text-gray-900">{target.name}</p>
                  <p className="text-xs text-gray-500">
                    {target.branch || target.department}
                  </p>
                </div>
              </div>
              {getStatusBadge(target, onToggleProgress)}
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {target.findingsItems.map((item, i) => (
                <span
                  key={i}
                  className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                상담 예정: {target.nextConsultationDate ? formatDate(target.nextConsultationDate) : "미정"}
              </span>
              {getRiskBadge(target.riskLevel)}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
