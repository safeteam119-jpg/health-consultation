import { NextRequest, NextResponse } from "next/server"
import { getCycleSettings, saveCycleSettings } from "@/lib/store"

export async function GET() {
  try {
    const settings = await getCycleSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json({ error: "설정 조회 실패" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()
    await saveCycleSettings(settings)
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("Save settings error:", error)
    return NextResponse.json({ error: "설정 저장 실패" }, { status: 500 })
  }
}
