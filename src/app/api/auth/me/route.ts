import { NextRequest, NextResponse } from "next/server"
import { getUsers } from "@/lib/store"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const [, username] = decoded.split(":")

    const users = await getUsers()
    const user = users.find(u => u.username === username)

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
