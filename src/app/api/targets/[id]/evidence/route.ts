import { NextRequest, NextResponse } from "next/server"
import { getTargets, saveTargets } from "@/lib/store"
import { Evidence } from "@/types"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { imageData, description } = await request.json()

    if (!imageData) {
      return NextResponse.json({ error: "이미지를 첨부해주세요." }, { status: 400 })
    }

    const targets = await getTargets()
    const index = targets.findIndex(t => t.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 })
    }

    const evidence: Evidence = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      imageData,
      description: description || "",
      createdAt: new Date().toISOString(),
    }

    if (!targets[index].evidences) {
      targets[index].evidences = []
    }
    targets[index].evidences.push(evidence)
    targets[index].updatedAt = new Date().toISOString()

    await saveTargets(targets)

    return NextResponse.json({ success: true, evidence, target: targets[index] })
  } catch (error) {
    console.error("Evidence upload error:", error)
    return NextResponse.json({ error: "증빙자료 저장 실패" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { evidenceId } = await request.json()

    const targets = await getTargets()
    const index = targets.findIndex(t => t.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 })
    }

    targets[index].evidences = (targets[index].evidences || []).filter(e => e.id !== evidenceId)
    targets[index].updatedAt = new Date().toISOString()

    await saveTargets(targets)

    return NextResponse.json({ success: true, target: targets[index] })
  } catch (error) {
    console.error("Evidence delete error:", error)
    return NextResponse.json({ error: "증빙자료 삭제 실패" }, { status: 500 })
  }
}
