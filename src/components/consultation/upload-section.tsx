"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PasteUpload } from "./paste-upload"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"

interface UploadSectionProps {
  lastUploadDate: string | null
  onUploadComplete: () => void
  userName: string
}

export function UploadSection({ lastUploadDate, onUploadComplete, userName }: UploadSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("uploadedBy", userName)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error })
        return
      }

      setResult({
        success: true,
        message: `업로드 완료: 전체 ${data.totalRecords}명 중 상담대상 ${data.targetCount}명 (고위험 ${data.highRiskCount}명)`,
        details: data.unmappedColumns?.length > 0
          ? `매핑되지 않은 컬럼: ${data.unmappedColumns.join(", ")}`
          : undefined,
      })

      onUploadComplete()
    } catch {
      setResult({ success: false, message: "업로드 중 오류가 발생했습니다." })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "업로드 중..." : "엑셀 업로드"}
          </Button>
          <PasteUpload onUploadComplete={onUploadComplete} userName={userName} />
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleUpload}
            className="hidden"
            aria-label="건강검진 결과 엑셀 파일 업로드"
          />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileSpreadsheet className="h-4 w-4" />
            <span>상담 기준 파일 적용됨</span>
          </div>
        </div>

      {lastUploadDate && (
        <span className="text-xs text-gray-400">
          최근 업로드: {new Date(lastUploadDate).toLocaleString("ko-KR")}
        </span>
      )}

      {result && (
        <div
          className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
            result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <div>
            <p>{result.message}</p>
            {result.details && <p className="text-xs mt-1 opacity-75">{result.details}</p>}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
