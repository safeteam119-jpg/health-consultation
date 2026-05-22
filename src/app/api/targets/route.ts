import { NextRequest, NextResponse } from "next/server"
import { getTargets, addTargets, deleteTargets, deleteAllTargets } from "@/lib/store"

export async function GET() {
  try {
    const targets = await getTargets()
    return NextResponse.json({ targets })
  } catch (error) {
    console.error("Get targets error:", error)
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { targets } = await request.json()
    await addTargets(targets)
    return NextResponse.json({ success: true, count: targets.length })
  } catch (error) {
    console.error("Save targets error:", error)
    return NextResponse.json({ error: "데이터 저장 실패" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids, deleteAll } = await request.json()

    if (deleteAll) {
      const count = await deleteAllTargets()
      return NextResponse.json({ success: true, deletedCount: count })
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "삭제할 대상자를 선택해주세요." }, { status: 400 })
    }

    const deletedCount = await deleteTargets(ids)
    return NextResponse.json({ success: true, deletedCount })
  } catch (error) {
    console.error("Delete targets error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
}
