import { NextRequest, NextResponse } from "next/server"
import { parseHealthCheckExcel } from "@/lib/excel-parser"
import { classifyTargets } from "@/lib/criteria"
import { addTargets, addUploadHistory } from "@/lib/store"
import { UploadHistory } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadedBy = formData.get("uploadedBy") as string || "admin"

    if (!file) {
      return NextResponse.json({ error: "파일을 선택해주세요." }, { status: 400 })
    }

    // 엑셀 파일 확인
    const validExtensions = [".xlsx", ".xls", ".csv"]
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    if (!validExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "엑셀 파일(.xlsx, .xls, .csv)만 업로드 가능합니다." },
        { status: 400 }
      )
    }

    // 파일 읽기
    const buffer = await file.arrayBuffer()

    // 엑셀 파싱
    const { results, unmappedColumns, totalRows } = parseHealthCheckExcel(buffer)

    if (results.length === 0) {
      return NextResponse.json(
        { error: "파싱된 데이터가 없습니다. 엑셀 형식을 확인해주세요." },
        { status: 400 }
      )
    }

    // 상담 대상자 자동 분류
    const targets = classifyTargets(results)

    // 저장
    await addTargets(targets)

    // 업로드 이력 저장
    const uploadRecord: UploadHistory = {
      id: `upload-${Date.now()}`,
      fileName: file.name,
      uploadDate: new Date().toISOString(),
      totalRecords: totalRows,
      targetCount: targets.length,
      uploadedBy,
    }
    await addUploadHistory(uploadRecord)

    return NextResponse.json({
      success: true,
      totalRecords: results.length,
      targetCount: targets.length,
      highRiskCount: targets.filter(t => t.riskLevel === "high").length,
      unmappedColumns,
      fileName: file.name,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "파일 업로드 처리 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
