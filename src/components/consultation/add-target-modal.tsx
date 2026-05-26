"use client"

import { useState } from "react"
import { ConsultationTarget, RiskLevel } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { X } from "lucide-react"

interface AddTargetModalProps {
  open: boolean
  onClose: () => void
  onAdd: (target: ConsultationTarget) => Promise<void>
}

const FINDINGS_OPTIONS = [
  "고혈압", "당뇨", "이상지질혈증", "간질환", "빈혈", "신장질환", "심뇌혈관질환", "비만"
]

export function AddTargetModal({ open, onClose, onAdd }: AddTargetModalProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    phone: "",
    department: "",
    branch: "",
    birthDate: "",
    examDate: new Date().toISOString().split("T")[0],
    riskLevel: "elderly" as RiskLevel,
    findingsItems: [] as string[],
    selectionReason: "",
  })

  if (!open) return null

  const resetForm = () => {
    setForm({
      name: "",
      employeeId: "",
      phone: "",
      department: "",
      branch: "",
      birthDate: "",
      examDate: new Date().toISOString().split("T")[0],
      riskLevel: "elderly",
      findingsItems: [],
      selectionReason: "",
    })
  }

  const toggleFinding = (item: string) => {
    setForm(prev => ({
      ...prev,
      findingsItems: prev.findingsItems.includes(item)
        ? prev.findingsItems.filter(f => f !== item)
        : [...prev.findingsItems, item]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) return

    setSaving(true)
    try {
      const target: ConsultationTarget = {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        healthCheckId: `manual-${Date.now()}`,
        employeeId: form.employeeId || `M-${Date.now().toString().slice(-6)}`,
        name: form.name,
        department: form.department,
        branch: form.branch,
        phone: form.phone,
        birthDate: form.birthDate,
        examDate: form.examDate,
        findingsItems: form.findingsItems.length > 0 ? form.findingsItems : ["기타"],
        selectionReason: form.selectionReason || "수기 등록",
        riskLevel: form.riskLevel,
        progressStatus: "not_started",
        consultationPhase: "none",
        needFirstConsultation: true,
        needSecondConsultation: false,
        nextConsultationDate: null,
        status: "pending",
        consultations: [],
        evidences: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await onAdd(target)
      resetForm()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between rounded-t-xl">
          <h3 className="font-bold text-gray-900">수기 대상자 추가</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">성명 *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="홍길동"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">사번</label>
              <Input
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                placeholder="자동생성"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">연락처 *</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="010-1234-5678"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">소속</label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="소속"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">사업장</label>
              <Input
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                placeholder="사업장명"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">생년월일</label>
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">검진일</label>
              <Input
                type="date"
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">위험도 분류</label>
            <Select
              value={form.riskLevel}
              onChange={(e) => setForm({ ...form, riskLevel: e.target.value as RiskLevel })}
            >
              <option value="elderly">고령자</option>
              <option value="high">고위험(고령제외)</option>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">유소견 항목</label>
            <div className="flex flex-wrap gap-2">
              {FINDINGS_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleFinding(item)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.findingsItems.includes(item)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">선정 사유</label>
            <Input
              value={form.selectionReason}
              onChange={(e) => setForm({ ...form, selectionReason: e.target.value })}
              placeholder="수기 등록 (사유 입력)"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving || !form.name || !form.phone}>
              {saving ? "저장 중..." : "대상자 추가"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
