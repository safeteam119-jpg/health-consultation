import { NextRequest, NextResponse } from "next/server"
import { validateLogin, initializeData } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    await initializeData()
    
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해주세요." },
        { status: 400 }
      )
    }

    const user = await validateLogin(username, password)

    if (!user) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      )
    }

    // 세션 토큰 생성 (간단한 구현)
    const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString("base64")

    const response = NextResponse.json({ user, token })
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8시간
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
