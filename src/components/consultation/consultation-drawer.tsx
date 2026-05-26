"use client"

import { useState } from "react"
import { ConsultationTarget, ConsultationRecord, ConsultationCycleSettings, Evidence } from "@/types"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatDate, getDDay } from "@/lib/utils"
import { calculateNextConsultationDate } from "@/lib/criteria"
import { FINDINGS_GUIDANCE } from "@/lib/criteria"
import { CONSULTATION_MATERIALS } from "@/lib/consultation-materials"
import { Phone, PhoneOff, Calendar, FileText, Plus, Clock, Image, Pencil, Save, X, BookOpen, Trash2 } from "lucide-react"

interface ConsultationDrawerProps {
  target: ConsultationTarget | null
  open: boolean
  onClose: () => void
  onSaveRecord: (targetId: string, record: Omit<ConsultationRecord, "id" | "targetId" | "createdAt">) => Promise<void>
  onDeleteRecord: (targetId: string, recordId: string) => Promise<void>
  onUpdateNextDate: (targetId: string, date: string) => Promise<void>
  onSaveEvidence: (targetId: string, imageData: string, description: string) => Promise<void>
  cycleSettings: ConsultationCycleSettings
  counselorName: string
}

export function ConsultationDrawer({
  target,
  open,
  onClose,
  onSaveRecord,
  onDeleteRecord,
  onUpdateNextDate,
  onSaveEvidence,
  cycleSettings,
  counselorName,
}: ConsultationDrawerProps) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ConsultationRecord>>({})
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [nextDateInput, setNextDateInput] = useState("")
  const [showMaterial, setShowMaterial] = useState<string | null>(null)
  // 증빙자료
  const [showEvidenceForm, setShowEvidenceForm] = useState(false)
  const [evidenceImage, setEvidenceImage] = useState("")
  const [evidenceDesc, setEvidenceDesc] = useState("")

  const [form, setForm] = useState({
    consultationDate: new Date().toISOString().split("T")[0],
    counselor: counselorName,
    callConnected: false,
    callFailed: false,
    healthRiskItems: [] as string[],
    consultationContent: "",
    hospitalRecommended: false,
    lifestyleGuidance: false,
    needFollowUp: true,
    managementStatus: "" as "unmanaged" | "managed" | "",
    nextConsultationDate: "",
    notes: "",
    consultationType: "first" as "first" | "second" | "follow-up",
  })

  if (!target) return null

  const resetForm = () => {
    const consultationType = target.needFirstConsultation
      ? "first"
      : target.needSecondConsultation
      ? "second"
      : "follow-up"

    setForm({
      consultationDate: new Date().toISOString().split("T")[0],
      counselor: counselorName,
      callConnected: false,
      callFailed: false,
      healthRiskItems: [...target.findingsItems],
      consultationContent: "",
      hospitalRecommended: false,
      lifestyleGuidance: false,
      needFollowUp: true,
      managementStatus: "",
      nextConsultationDate: calculateNextConsultationDate(
        new Date().toISOString().split("T")[0],
        target.riskLevel,
        cycleSettings
      ),
      notes: "",
      consultationType,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSaveRecord(target.id, {
        ...form,
        callConnected: form.callConnected && !form.callFailed,
      })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleNextDateSave = async () => {
    if (nextDateInput) {
      await onUpdateNextDate(target.id, nextDateInput)
      setShowDatePicker(false)
    }
  }

  const handleEvidencePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (ev) => {
            setEvidenceImage(ev.target?.result as string)
          }
          reader.readAsDataURL(file)
        }
        e.preventDefault()
        break
      }
    }
  }

  const handleEvidenceSave = async () => {
    if (!evidenceImage) return
    setSaving(true)
    try {
      await onSaveEvidence(target.id, evidenceImage, evidenceDesc)
      setEvidenceImage("")
      setEvidenceDesc("")
      setShowEvidenceForm(false)
    } finally {
      setSaving(false)
    }
  }

  const { label: dDayLabel, status: dDayStatus } = target.nextConsultationDate
    ? getDDay(target.nextConsultationDate)
    : { label: "-", status: "none" as const }

  return (
    <Drawer open={open} onClose={onClose} title={`${target.name} 상담 상세`}>
      <div className="space-y-6">
        {/* 대상자 정보 */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">성명</span>
              <p className="font-medium">{target.name}</p>
            </div>
            <div>
              <span className="text-gray-500">사번</span>
              <p className="font-medium">{target.employeeId}</p>
            </div>
            <div>
              <span className="text-gray-500">생년월일</span>
              <p className="font-medium">{target.birthDate || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">사업장</span>
              <p className="font-medium">{target.branch || target.department}</p>
            </div>
            <div>
              <span className="text-gray-500">연락처</span>
              <p className="font-medium">{target.phone}</p>
            </div>
            <div>
              <span className="text-gray-500">검진일</span>
              <p className="font-medium">{formatDate(target.examDate)}</p>
            </div>
            <div>
              <span className="text-gray-500">위험도</span>
              <p>
                <Badge variant={target.riskLevel === "elderly" || target.riskLevel === "high" ? "high" : "moderate"}>
                  {target.riskLevel === "elderly" ? "고령자" : "고위험(고령제외)"}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-gray-500">진행상태</span>
              <p>
                <Badge variant={target.progressStatus === "completed" ? "completed" : "scheduled"}>
                  {target.progressStatus === "completed" ? "완료" : "진행중"}
                </Badge>
              </p>
            </div>
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">유소견 항목</span>
              <button
                onClick={() => setShowMaterial(target.findingsItems[0] || null)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded"
              >
                <BookOpen className="h-3 w-3" />
                유소견 상담자료
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {target.findingsItems.map((item, i) => (
                <span
                  key={i}
                  className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => setShowMaterial(item)}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">선정 사유</span>
            <p className="text-gray-700 mt-1">{target.selectionReason}</p>
          </div>

          {/* 다음 상담일 (달력으로 변경 가능) */}
          <div className="flex items-center gap-3 text-sm border-t pt-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>다음 상담: {target.nextConsultationDate ? formatDate(target.nextConsultationDate) : "미정"}</span>
            {dDayStatus !== "none" && (
              <Badge variant={dDayStatus === "today" ? "today" : dDayStatus === "overdue" ? "overdue" : "scheduled"}>
                {dDayLabel}
              </Badge>
            )}
            <button
              onClick={() => {
                setNextDateInput(target.nextConsultationDate || new Date().toISOString().split("T")[0])
                setShowDatePicker(true)
              }}
              className="ml-auto text-blue-600 hover:text-blue-800 p-1"
              title="날짜 변경"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          {showDatePicker && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
              <Input
                type="date"
                value={nextDateInput}
                onChange={(e) => setNextDateInput(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={handleNextDateSave}>저장</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDatePicker(false)}>취소</Button>
            </div>
          )}
        </div>

        {/* 상담 이력 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              상담 이력 ({target.consultations.length}건)
            </h3>
            <Button
              size="sm"
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
            >
              <Plus className="h-4 w-4" />
              상담 기록
            </Button>
          </div>

          {target.consultations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">상담 기록이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {[...target.consultations].reverse().map((record) => (
                <ConsultationHistoryItem
                  key={record.id}
                  record={record}
                  isEditing={editingRecordId === record.id}
                  editForm={editForm}
                  onStartEdit={() => {
                    setEditingRecordId(record.id)
                    setEditForm({ ...record })
                  }}
                  onCancelEdit={() => setEditingRecordId(null)}
                  onSaveEdit={async () => {
                    // 수정된 내용으로 저장 (기존 기록 덮어쓰기)
                    await onSaveRecord(target.id, {
                      ...record,
                      ...editForm,
                    } as Omit<ConsultationRecord, "id" | "targetId" | "createdAt">)
                    setEditingRecordId(null)
                  }}
                  onEditChange={(updates) => setEditForm({ ...editForm, ...updates })}
                  onDelete={async () => {
                    if (confirm("이 상담 기록을 삭제하시겠습니까?")) {
                      await onDeleteRecord(target.id, record.id)
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 증빙자료 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Image className="h-4 w-4" />
              증빙자료 ({(target.evidences || []).length}건)
            </h3>
            <Button size="sm" variant="outline" onClick={() => setShowEvidenceForm(true)}>
              <Plus className="h-4 w-4" />
              증빙 추가
            </Button>
          </div>

          {showEvidenceForm && (
            <div className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
              <div
                onPaste={handleEvidencePaste}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500 cursor-pointer hover:border-blue-400 min-h-[80px] flex items-center justify-center"
                tabIndex={0}
              >
                {evidenceImage ? (
                  <img src={evidenceImage} alt="증빙" className="max-h-40 rounded" />
                ) : (
                  "여기에 이미지를 붙여넣기 (Ctrl+V) 하세요"
                )}
              </div>
              <Input
                placeholder="증빙자료 설명 (예: 병원 진료 영수증, 약 처방전 등)"
                value={evidenceDesc}
                onChange={(e) => setEvidenceDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEvidenceSave} disabled={!evidenceImage || saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowEvidenceForm(false); setEvidenceImage(""); setEvidenceDesc("") }}>
                  취소
                </Button>
              </div>
            </div>
          )}

          {(target.evidences || []).length === 0 && !showEvidenceForm ? (
            <p className="text-sm text-gray-400 text-center py-4">증빙자료가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {(target.evidences || []).map((ev) => (
                <div key={ev.id} className="border border-gray-200 rounded-lg p-3 flex gap-3">
                  <img src={ev.imageData} alt="증빙" className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1 text-sm">
                    <p className="text-gray-700">{ev.description || "(설명 없음)"}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(ev.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상담 기록 입력 폼 */}
        {showForm && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">새 상담 기록</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">상담일</label>
                  <Input
                    type="date"
                    value={form.consultationDate}
                    onChange={(e) => setForm({ ...form, consultationDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">상담자</label>
                  <Input
                    value={form.counselor}
                    onChange={(e) => setForm({ ...form, counselor: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">상담 유형</label>
                  <Select
                    value={form.consultationType}
                    onChange={(e) => setForm({ ...form, consultationType: e.target.value as "first" | "second" | "follow-up" })}
                  >
                    <option value="first">1차 상담</option>
                    <option value="second">2차 상담</option>
                    <option value="follow-up">추적 상담</option>
                  </Select>
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={form.callConnected}
                      onChange={(e) => setForm({ ...form, callConnected: e.target.checked, callFailed: e.target.checked ? false : form.callFailed })}
                      className="rounded border-gray-300"
                    />
                    <Phone className="h-3.5 w-3.5 text-green-600" />
                    통화연결
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={form.callFailed}
                      onChange={(e) => setForm({ ...form, callFailed: e.target.checked, callConnected: e.target.checked ? false : form.callConnected })}
                      className="rounded border-gray-300"
                    />
                    <PhoneOff className="h-3.5 w-3.5 text-red-500" />
                    통화불가
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">관리 상태</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="managementStatus"
                      checked={form.managementStatus === "unmanaged"}
                      onChange={() => setForm({ ...form, managementStatus: "unmanaged" })}
                      className="border-gray-300"
                    />
                    미관리중
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="managementStatus"
                      checked={form.managementStatus === "managed"}
                      onChange={() => setForm({ ...form, managementStatus: "managed" })}
                      className="border-gray-300"
                    />
                    관리중
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">상담 내용</label>
                <Textarea
                  value={form.consultationContent}
                  onChange={(e) => setForm({ ...form, consultationContent: e.target.value })}
                  placeholder="상담 내용을 입력하세요"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.hospitalRecommended}
                    onChange={(e) => setForm({ ...form, hospitalRecommended: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  병원 내원 권고
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.lifestyleGuidance}
                    onChange={(e) => setForm({ ...form, lifestyleGuidance: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  생활습관 개선 안내
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.needFollowUp}
                    onChange={(e) => setForm({ ...form, needFollowUp: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  재상담 필요
                </label>
              </div>
              {form.needFollowUp && (
                <div>
                  <label className="text-sm font-medium text-gray-700">다음 상담 예정일</label>
                  <Input
                    type="date"
                    value={form.nextConsultationDate}
                    onChange={(e) => setForm({ ...form, nextConsultationDate: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">비고</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="비고"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "저장 중..." : "상담 기록 저장"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  취소
                </Button>
              </div>
            </form>
          </div>
        )}
        {/* 상담자료 모달 */}
        {showMaterial && CONSULTATION_MATERIALS[showMaterial] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowMaterial(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between rounded-t-xl">
                <h3 className="font-bold text-gray-900">{CONSULTATION_MATERIALS[showMaterial].title}</h3>
                <button onClick={() => setShowMaterial(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                {/* 다른 항목 탭 */}
                {target.findingsItems.length > 1 && (
                  <div className="flex flex-wrap gap-1 pb-2 border-b">
                    {target.findingsItems.map((item) => (
                      CONSULTATION_MATERIALS[item] && (
                        <button
                          key={item}
                          onClick={() => setShowMaterial(item)}
                          className={`text-xs px-3 py-1 rounded-full ${showMaterial === item ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          {item}
                        </button>
                      )
                    ))}
                  </div>
                )}
                {CONSULTATION_MATERIALS[showMaterial].sections.map((section, idx) => (
                  <div key={idx}>
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">{section.heading}</h4>
                    <ul className="space-y-1">
                      {section.content.map((line, li) => (
                        <li key={li} className="text-sm text-gray-600 pl-2">{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}

function ConsultationHistoryItem({ record, isEditing, editForm, onStartEdit, onCancelEdit, onSaveEdit, onEditChange, onDelete }: {
  record: ConsultationRecord
  isEditing: boolean
  editForm: Partial<ConsultationRecord>
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditChange: (updates: Partial<ConsultationRecord>) => void
  onDelete: () => void
}) {
  if (isEditing) {
    return (
      <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-4 text-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-blue-800">수정 중</span>
          <div className="flex gap-1">
            <button onClick={onSaveEdit} className="text-blue-600 hover:text-blue-800 p-1" title="저장">
              <Save className="h-4 w-4" />
            </button>
            <button onClick={onCancelEdit} className="text-gray-400 hover:text-gray-600 p-1" title="취소">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">상담일</label>
            <input type="date" className="w-full border border-gray-200 rounded p-1.5 text-sm mt-1" value={editForm.consultationDate || ""} onChange={(e) => onEditChange({ consultationDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">상담자</label>
            <input className="w-full border border-gray-200 rounded p-1.5 text-sm mt-1" value={editForm.counselor || ""} onChange={(e) => onEditChange({ counselor: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">상담 유형</label>
            <select className="w-full border border-gray-200 rounded p-1.5 text-sm mt-1" value={editForm.consultationType || "first"} onChange={(e) => onEditChange({ consultationType: e.target.value as "first" | "second" | "follow-up" })}>
              <option value="first">1차 상담</option>
              <option value="second">2차 상담</option>
              <option value="follow-up">추적 상담</option>
            </select>
          </div>
          <div className="flex items-end gap-3 pb-1">
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={editForm.callConnected || false} onChange={(e) => onEditChange({ callConnected: e.target.checked })} className="rounded border-gray-300" />
              통화연결
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={editForm.hospitalRecommended || false} onChange={(e) => onEditChange({ hospitalRecommended: e.target.checked })} className="rounded border-gray-300" />
            병원 내원 권고
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={editForm.lifestyleGuidance || false} onChange={(e) => onEditChange({ lifestyleGuidance: e.target.checked })} className="rounded border-gray-300" />
            생활습관 개선 안내
          </label>
        </div>

        <div>
          <label className="text-xs text-gray-500">관리 상태</label>
          <div className="flex items-center gap-3 mt-1">
            <label className="flex items-center gap-1 text-xs">
              <input type="radio" name="editMgmt" checked={(editForm.managementStatus || "") === "unmanaged"} onChange={() => onEditChange({ managementStatus: "unmanaged" })} className="border-gray-300" />
              미관리중
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input type="radio" name="editMgmt" checked={(editForm.managementStatus || "") === "managed"} onChange={() => onEditChange({ managementStatus: "managed" })} className="border-gray-300" />
              관리중
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">상담 내용</label>
          <textarea className="w-full border border-gray-200 rounded p-2 text-sm mt-1" rows={3} value={editForm.consultationContent || ""} onChange={(e) => onEditChange({ consultationContent: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={editForm.needFollowUp || false} onChange={(e) => onEditChange({ needFollowUp: e.target.checked })} className="rounded border-gray-300" />
              재상담 필요
            </label>
          </div>
          {editForm.needFollowUp && (
            <div>
              <label className="text-xs text-gray-500">다음 상담 예정일</label>
              <input type="date" className="w-full border border-gray-200 rounded p-1.5 text-sm mt-1" value={editForm.nextConsultationDate || ""} onChange={(e) => onEditChange({ nextConsultationDate: e.target.value })} />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500">비고</label>
          <textarea className="w-full border border-gray-200 rounded p-2 text-sm mt-1" rows={1} value={editForm.notes || ""} onChange={(e) => onEditChange({ notes: e.target.value })} />
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{formatDate(record.consultationDate)}</span>
          <Badge variant={record.consultationType === "first" ? "default" : record.consultationType === "second" ? "scheduled" : "pending"}>
            {record.consultationType === "first" ? "1차" : record.consultationType === "second" ? "2차" : "추적"}
          </Badge>
          {record.managementStatus && (
            <Badge variant={record.managementStatus === "managed" ? "completed" : "overdue"}>
              {record.managementStatus === "managed" ? "관리중" : "미관리중"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{record.counselor}</span>
          <button onClick={onStartEdit} className="text-gray-400 hover:text-blue-600 p-1" title="수정">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600 p-1" title="삭제">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <span>통화: {record.callConnected ? "✅ 연결" : "❌ 연락불가"}</span>
        <span>병원권고: {record.hospitalRecommended ? "✅" : "-"}</span>
        <span>생활습관안내: {record.lifestyleGuidance ? "✅" : "-"}</span>
      </div>
      {record.consultationContent && (
        <div>
          <span className="text-gray-500">상담내용:</span>
          <p className="text-gray-700 mt-0.5">{record.consultationContent}</p>
        </div>
      )}
      {record.notes && (
        <div>
          <span className="text-gray-500">비고:</span>
          <p className="text-gray-700 mt-0.5">{record.notes}</p>
        </div>
      )}
    </div>
  )
}
