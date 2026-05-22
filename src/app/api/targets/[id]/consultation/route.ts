import { NextRequest, NextResponse } from "next/server"
import { addConsultationRecord } from "@/lib/store"
import { ConsultationRecord } from "@/types"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const record: ConsultationRecord = {
      id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      targetId: id,
      consultationDate: body.consultationDate,
      counselor: body.counselor,
      callConnected: body.callConnected,
      healthRiskItems: body.healthRiskItems || [],
      consultationContent: body.consultationContent || "",
      hospitalRecommended: body.hospitalRecommended || false,
      lifestyleGuidance: body.lifestyleGuidance || false,
      needFollowUp: body.needFollowUp || false,
      managementStatus: body.managementStatus || "",
      nextConsultationDate: body.nextConsultationDate || null,
      notes: body.notes || "",
      consultationType: body.consultationType || "first",
      createdAt: new Date().toISOString(),
    }

    const target = await addConsultationRecord(id, record)

    if (!target) {
      return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({ target, record })
  } catch (error) {
    console.error("Add consultation error:", error)
    return NextResponse.json({ error: "상담 기록 저장 실패" }, { status: 500 })
  }
}
