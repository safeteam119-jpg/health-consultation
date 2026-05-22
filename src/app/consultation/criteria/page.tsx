"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function CriteriaPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me").then(res => {
      if (!res.ok) router.push("/login")
      else setAuthed(true)
    })
  }, [router])

  if (!authed) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/consultation")} aria-label="뒤로가기">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">관리 기준 및 지침</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* 관리 대상 */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">관리 기준</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">관리 대상</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="font-medium text-purple-700">1. 고령 유소견자</span> (만 55세 이상; 71년 이전 출생)</p>
                  <p className="pl-4 text-red-600 font-medium">* 60세 이상 고위험군은 3개월마다 주기적 전화상담 (건강상태 확인)</p>
                  <p><span className="font-medium text-red-700">2. 고위험군</span></p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">관리 항목 (고령자)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 border-b font-medium w-20">구분</th>
                        <th className="text-left py-2 px-3 border-b font-medium">항목</th>
                        <th className="text-left py-2 px-3 border-b font-medium">관리 방법</th>
                        <th className="text-left py-2 px-3 border-b font-medium">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b align-top">
                        <td className="py-2 px-3 font-medium text-red-700" rowSpan={2}>고위험</td>
                        <td className="py-2 px-3">고혈압, 당뇨, 이상지질혈증(LDL/중성지방), 심뇌혈관질환 위험도 평가 점수 5% 이상, 골다공증</td>
                        <td className="py-2 px-3 text-gray-600">관리 실시 (유질환자, 결과 비정상일 경우 관리 실시)<br/><br/>골다공증의 경우 1차 상담 건강관리 교육까지만 실시</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">심뇌혈관질환 집중 관리, 유질환자는 보통 병원 진단 받아 이미 치료 중임<br/><br/>골다공증은 병원 치료보다는 생활 수칙 안내가 중요</td>
                      </tr>
                      <tr className="border-b align-top">
                        <td className="py-2 px-3">빈혈, 신장질환, 간질환</td>
                        <td className="py-2 px-3 text-gray-600">고위험군일 경우 관리 실시</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">어느 정도의 상승 소견은 일반적으로 나타날 수 있음</td>
                      </tr>
                      <tr className="align-top">
                        <td className="py-2 px-3 font-medium text-gray-700">기타</td>
                        <td className="py-2 px-3">비만, 복부비만, 기타 흉부질환</td>
                        <td className="py-2 px-3 text-gray-600">문자 발송만 진행<br/><br/>비만, 복부비만은 고혈압/당뇨/이상지질혈증과 함께 문제일 경우, 관리 실시</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">비만이 다른 질환과 같이 나타날 경우 대사증후군 가능성 있어 관리 필요</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 관리 지침 */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">관리 지침</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-blue-800 mb-2">1차 상담</h3>
                <div className="bg-blue-50 rounded-lg p-4 text-sm space-y-1">
                  <p>1. 병원 방문 여부 확인 (검사, 약 처방 등)</p>
                  <p>2. 관련 증상 여부 확인</p>
                  <p>3. 생활습관 관리 교육</p>
                  <p className="mt-2 text-blue-700 font-medium">→ 치료 중일 경우: 병원명 확인, 관리 완료</p>
                  <p className="text-blue-700 font-medium">→ 미관리 상태일 경우: 병원 방문 권고, 증빙 자료 제출 안내 및 1개월 이내 제출 확인되지 않을 경우 재연락 예정임을 안내</p>
                  <p className="text-gray-500 text-xs mt-2">(증빙자료 제출됨: 2차 상담 진행 후, 2차 상담 내용 기록)</p>
                  <p className="text-gray-500 text-xs">(증상 동반할 경우: 심층진단 안내)</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-green-800 mb-2">2차 상담</h3>
                <div className="bg-green-50 rounded-lg p-4 text-sm space-y-1">
                  <p>1. 병원 방문 여부 및 진단 결과 확인</p>
                  <p>2. 관련 증상 여부 확인</p>
                  <p>3. 생활습관 변화 여부 점검</p>
                  <p className="mt-2 text-green-700 font-medium">→ 치료 중일 경우: 병원명 확인, 관리 완료</p>
                  <p className="text-green-700 font-medium">→ 미관리 상태일 경우: 병원 방문 권고, 증빙 자료 제출 안내 및 1개월 이내 재연락 예정임을 안내</p>
                  <p className="text-green-700 font-medium">→ 증상 동반할 경우: 사내 고위험 수치 관리 필요 시, 심층진단 안내 예정임을 안내</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">기록 보관</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p>(사후관리 내용) 건강검진 수치 데이터에 올려서 HR 업로드</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 유소견 판정 기준 - 고위험 기준 */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 border-b pb-2">유소견 판정 기준</h2>
            <p className="text-xs text-gray-500 mb-4">[고위험 기준 / 2026.02.06 업데이트]</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-red-50">
                  <tr>
                    <th className="text-left py-2 px-3 border-b font-medium text-red-800">질환명</th>
                    <th className="text-left py-2 px-3 border-b font-medium text-red-800">검진항목</th>
                    <th className="text-left py-2 px-3 border-b font-medium text-red-800">고위험군 기준</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium" rowSpan={2}>고혈압</td>
                    <td className="py-2 px-3">수축기</td>
                    <td className="py-2 px-3 text-red-700 font-medium">160 초과</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">이완기</td>
                    <td className="py-2 px-3 text-red-700 font-medium">100 초과</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium">당뇨</td>
                    <td className="py-2 px-3">식전혈당</td>
                    <td className="py-2 px-3 text-red-700 font-medium">250 초과</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium" rowSpan={2}>고지혈증</td>
                    <td className="py-2 px-3">LDL 콜레스테롤</td>
                    <td className="py-2 px-3 text-red-700 font-medium">190 초과</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">중성지방</td>
                    <td className="py-2 px-3 text-red-700 font-medium">500 초과</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium" rowSpan={3}>간장질환</td>
                    <td className="py-2 px-3">AST</td>
                    <td className="py-2 px-3 text-red-700 font-medium">250 초과</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">ALT</td>
                    <td className="py-2 px-3 text-red-700 font-medium">225 초과</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">r-GTP</td>
                    <td className="py-2 px-3 text-red-700 font-medium">200 초과</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium">빈혈</td>
                    <td className="py-2 px-3">혈색소</td>
                    <td className="py-2 px-3 text-red-700 font-medium">8 미만</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium">신장질환</td>
                    <td className="py-2 px-3">GFR</td>
                    <td className="py-2 px-3 text-red-700 font-medium">30 미만</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium">흉부질환</td>
                    <td className="py-2 px-3">흉부방사선</td>
                    <td className="py-2 px-3 text-red-700 font-medium">활동성 질환</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">심뇌혈관질환</td>
                    <td className="py-2 px-3">발병위험도</td>
                    <td className="py-2 px-3 text-red-700 font-medium">10% 이상</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 건강검진 정상 범위 참고 */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">건강검진 정상 범위 (참고)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 border-b font-medium">검사항목</th>
                    <th className="text-left py-2 px-3 border-b font-medium">단위</th>
                    <th className="text-left py-2 px-3 border-b font-medium">정상A</th>
                    <th className="text-left py-2 px-3 border-b font-medium">정상B(경계)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="py-2 px-3">혈압(수축기/이완기)</td><td className="py-2 px-3">mmHg</td><td className="py-2 px-3">120 이하 / 80 이하</td><td className="py-2 px-3">120-139 / 80-89</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">키, 몸무게</td><td className="py-2 px-3">BMI (kg/m2)</td><td className="py-2 px-3">18.5-24.9</td><td className="py-2 px-3">25-29.9 또는 18.5 미만</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">허리둘레</td><td className="py-2 px-3">cm</td><td className="py-2 px-3">남 90 미만 / 여 85 미만</td><td className="py-2 px-3">-</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">혈색소</td><td className="py-2 px-3">g/dL</td><td className="py-2 px-3">남 13.0-16.5 / 여 12.0-15.5</td><td className="py-2 px-3">-</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">공복혈당</td><td className="py-2 px-3">mg/dL</td><td className="py-2 px-3">100 미만</td><td className="py-2 px-3">100-125</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">총콜레스테롤</td><td className="py-2 px-3">mg/dL</td><td className="py-2 px-3">200 미만</td><td className="py-2 px-3">200-239</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">LDL콜레스테롤</td><td className="py-2 px-3">mg/dL</td><td className="py-2 px-3">130 미만</td><td className="py-2 px-3">130-159</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">AST(SGOT)</td><td className="py-2 px-3">U/L</td><td className="py-2 px-3">40 이하</td><td className="py-2 px-3">41-50</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">ALT(SGPT)</td><td className="py-2 px-3">U/L</td><td className="py-2 px-3">35 이하</td><td className="py-2 px-3">36-45</td></tr>
                  <tr className="border-b"><td className="py-2 px-3">r-GTP</td><td className="py-2 px-3">U/L</td><td className="py-2 px-3">남 11-63 / 여 8-35</td><td className="py-2 px-3">64-77 / 36-45</td></tr>
                  <tr><td className="py-2 px-3">신사구체여과율(GFR)</td><td className="py-2 px-3">mL/min</td><td className="py-2 px-3">60 이상</td><td className="py-2 px-3">-</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
