import { NextRequest, NextResponse } from "next/server"
import { getTargets, saveTargets } from "@/lib/store"
import { ConsultationTarget } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const { target } = await request.json() as { target: ConsultationTarget }

    if (!target || !target.name || !target.phone) {
      return NextResponse.json({ error: "성명과 연락처는 필수입니다." }, { status: 400 })
    }

    const existing = await getTargets()

    // ID 보장
    if (!target.id) {
      target.id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }

    // 중복 체크 없이 바로 추가 (수기 등록은 의도적 추가)
    existing.push(target)
    await saveTargets(existing)

    return NextResponse.json({ success: true, target })
  } catch (error) {
    console.error("Manual add target error:", error)
    return NextResponse.json({ error: "수기 대상자 추가 실패" }, { status: 500 })
  }
}
