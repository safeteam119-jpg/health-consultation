"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardPaste, CheckCircle2, AlertCircle, X } from "lucide-react"

interface PasteUploadProps {
  onUploadComplete: () => void
  userName: string
}

export function PasteUpload({ onUploadComplete, userName }: PasteUploadProps) {
  const [open, setOpen] = useState(false)
  const [pasteData, setPasteData] = useState("")
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleProcess = async () => {
    if (!pasteData.trim()) return

    setProcessing(true)
    setResult(null)

    try {
      const res = await fetch("/api/upload/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: pasteData, uploadedBy: userName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error })
        return
      }

      setResult({
        success: true,
        message: `분석 완료: 전체 ${data.totalRecords}명 중 상담대상 ${data.targetCount}명 (고령자 ${data.elderlyCount || 0}명, 고위험 ${data.highRiskCount}명)`,
      })

      setPasteData("")
      onUploadComplete()
    } catch {
      setResult({ success: false, message: "처리 중 오류가 발생했습니다." })
    } finally {
      setProcessing(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ClipboardPaste className="h-4 w-4" />
        붙여넣기로 입력
      </Button>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4" />
          엑셀 데이터 붙여넣기
        </h3>
        <button
          onClick={() => { setOpen(false); setResult(null) }}
          className="p-1 hover:bg-gray-100 rounded"
          aria-label="닫기"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <p className="text-xs text-gray-500">
        엑셀에서 데이터 범위를 선택 → 복사(Ctrl+C) → 아래에 붙여넣기(Ctrl+V)<br/>
        <span className="text-gray-400">※ 헤더 포함/미포함 모두 가능. 헤더 없이 데이터만 붙여넣어도 자동 인식됩니다.</span>
      </p>

      <Textarea
        value={pasteData}
        onChange={(e) => setPasteData(e.target.value)}
        placeholder={"사업장명\t재직상태\t이름\t사번\t등급\t생년월일\t성별\t기준나이\t휴대폰번호\t검진기관명\t예약상태\t검진일\t공단대상여부\t검진결과등록\t검진종류\t검진결과동의\t보건관리자제공동의(결과)\t종합판정\t검진소견암호화내용\t수축기혈압\t이완기혈압\t고혈압판정\t신장\t체중\t허리둘레\t체질량지수(BMI)\t비만판정\t혈색소(Hb)\t빈혈판정\t공복시혈당(FBS)\t당뇨판정\t총콜레스테롤\tLDL콜레스테롤\tHDL콜레스테롤\t중성지방(TG)\t이상지질혈증판정\tAST(SGOT)\tALT(SGPT)\tr-GTP(GGT)\t간질환판정\t크레아티닌(Creatinine)\t요단백수치\t요단백\t신사구체여과율(GFR)\t신장질환판정\t시력(좌)\t시력(우)\t흉부X선\t청력(좌)\t청력(우)\n매장\t재직\t강희경\tAD6148909\t임직원(미지원)\t1995-01-06\t여\t31\t010-4322-1087\t도화탑내과의원\t\t2026-03-26\tY\tY\t공단검진\t\tY\t요관찰자(질환의심)\t\t108\t56\t정상A\t162.6\t82.6\t90.0\t31.2\t요관찰자(질환의심)\t11.5\t정상B\t80\t정상A\t\t\t\t\t\t14\t15\t13\t정상A\t0.68\t\t약양성\t116\t정상B\t1.0\t1.0\t정상\t정상\t정상"}
        rows={8}
        className="font-mono text-xs"
      />

      <div className="flex items-center gap-3">
        <Button onClick={handleProcess} disabled={processing || !pasteData.trim()}>
          {processing ? "분석 중..." : "데이터 분석"}
        </Button>
        <Button variant="ghost" onClick={() => setPasteData("")} disabled={!pasteData}>
          초기화
        </Button>
        {pasteData && (
          <span className="text-xs text-gray-400">
            {pasteData.split("\n").filter(l => l.trim()).length - 1}행 감지
          </span>
        )}
      </div>

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
          <p>{result.message}</p>
        </div>
      )}
    </div>
  )
}
