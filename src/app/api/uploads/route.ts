import { NextResponse } from "next/server"
import { getUploadHistory } from "@/lib/store"

export async function GET() {
  try {
    const history = await getUploadHistory()
    return NextResponse.json({ history })
  } catch (error) {
    console.error("Get upload history error:", error)
    return NextResponse.json({ error: "업로드 이력 조회 실패" }, { status: 500 })
  }
}
