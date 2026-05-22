import { NextRequest, NextResponse } from "next/server"
import { getTargets, updateTarget } from "@/lib/store"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const targets = await getTargets()
    const target = targets.find(t => t.id === id)
    
    if (!target) {
      return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({ target })
  } catch (error) {
    console.error("Get target error:", error)
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()
    const target = await updateTarget(id, updates)

    if (!target) {
      return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({ target })
  } catch (error) {
    console.error("Update target error:", error)
    return NextResponse.json({ error: "데이터 수정 실패" }, { status: 500 })
  }
}
