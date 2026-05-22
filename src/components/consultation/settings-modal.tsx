"use client"

import { useState } from "react"
import { ConsultationCycleSettings } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Settings } from "lucide-react"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  settings: ConsultationCycleSettings
  onSave: (settings: ConsultationCycleSettings) => Promise<void>
}

export function SettingsModal({ open, onClose, settings, onSave }: SettingsModalProps) {
  const [form, setForm] = useState<ConsultationCycleSettings>(settings)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              상담 주기 설정
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="닫기">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500">
              위험도별 상담 주기를 설정합니다. 상담 완료일 기준으로 다음 상담일이 자동 계산됩니다.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  고위험 상담 주기 (일)
                </label>
                <Input
                  type="number"
                  value={form.highRiskCycleDays}
                  onChange={(e) => setForm({ ...form, highRiskCycleDays: parseInt(e.target.value) || 90 })}
                  min={1}
                />
                <p className="text-xs text-gray-400 mt-1">기본값: 90일 (3개월)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  일반관리 상담 주기 (일)
                </label>
                <Input
                  type="number"
                  value={form.moderateCycleDays}
                  onChange={(e) => setForm({ ...form, moderateCycleDays: parseInt(e.target.value) || 30 })}
                  min={1}
                />
                <p className="text-xs text-gray-400 mt-1">기본값: 30일 (1개월)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  확인필요 상담 주기 (일)
                </label>
                <Input
                  type="number"
                  value={form.lowCycleDays}
                  onChange={(e) => setForm({ ...form, lowCycleDays: parseInt(e.target.value) || 60 })}
                  min={1}
                />
                <p className="text-xs text-gray-400 mt-1">기본값: 60일 (2개월)</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
