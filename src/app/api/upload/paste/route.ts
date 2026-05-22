import { NextRequest, NextResponse } from "next/server"
import { HealthCheckResult } from "@/types"
import { classifyTargets } from "@/lib/criteria"
import { addTargets, addUploadHistory } from "@/lib/store"
import { UploadHistory } from "@/types"

// 엑셀 컬럼명 매핑 (헤더가 있을 때 사용)
const COLUMN_MAPPINGS: Record<string, string[]> = {
  employeeId: ["사번", "사원번호", "직원번호", "ID", "사원ID"],
  name: ["이름", "성명", "성함", "직원명"],
  department: ["고객사명", "소속", "부서", "조직", "소속부서"],
  branch: ["사업장명", "매장명", "부서명", "지점", "지점명", "근무지"],
  phone: ["휴대폰번호", "연락처", "전화번호", "핸드폰", "휴대폰", "HP", "전화"],
  birthDate: ["생년월일", "생일", "출생일"],
  examDate: ["검진일", "검진일자", "건강검진일", "수검일", "검사일"],
  age: ["기준나이", "나이", "연령"],
  gender: ["성별"],
  systolicBP: ["수축기혈압", "수축기", "최고혈압", "SBP"],
  diastolicBP: ["이완기혈압", "이완기", "최저혈압", "DBP"],
  fastingGlucose: ["공복시혈당(FBS)", "공복시혈당", "공복혈당", "혈당", "식전혈당", "FBS"],
  ldlCholesterol: ["LDL콜레스테롤", "LDL", "LDL-C", "저밀도콜레스테롤"],
  bmi: ["체질량지수(BMI)", "체질량지수", "BMI"],
  ast: ["AST(SGOT)", "AST", "AST(GOT)", "GOT", "SGOT"],
  alt: ["ALT(SGPT)", "ALT", "ALT(GPT)", "GPT", "SGPT"],
  gtp: ["r-GTP(GGT)", "r-GTP", "GTP", "rGTP", "γ-GTP", "감마GTP", "GGT"],
  hemoglobin: ["혈색소(Hb)", "혈색소", "Hb", "헤모글로빈", "HGB"],
  gfr: ["신사구체여과율(GFR)", "신사구체여과율", "GFR", "사구체여과율", "eGFR"],
  cvdRisk: ["심뇌혈관위험도", "CVD위험도", "심혈관위험도", "발병위험도"],
  chestXray: ["흉부X선", "흉부방사선", "Chest X-ray", "흉부촬영"],
  result: ["종합판정", "판정결과", "판정", "검진결과"],
  findings: ["유소견내용", "유소견", "소견", "유소견사항", "소견내용"],
  hypertensionResult: ["고혈압판정"],
  diabetesResult: ["당뇨판정"],
  dyslipidemiaResult: ["이상지질혈증판정"],
  liverResult: ["간질환판정"],
  anemiaResult: ["빈혈판정"],
  kidneyResult: ["신장질환판정"],
  obesityResult: ["비만판정"],
  examInstitution: ["검진기관명", "검진기관", "병원명"],
  examType: ["검진종류", "검진유형"],
  reservationStatus: ["예약상태"],
  employmentStatus: ["재직상태"],
}

/**
 * 아성다이소 건강검진 엑셀 고정 컬럼 순서 (헤더 없이 붙여넣기 할 때 사용)
 * 
 * 확정된 컬럼 순서 (헤더 기준):
 * 0: 사업장명, 1: 재직상태, 2: 이름, 3: 사번, 4: 등급, 5: 생년월일, 6: 성별, 7: 기준나이
 * 8: 휴대폰번호, 9: 검진기관명, 10: 예약상태, 11: 검진일
 * 12: 공단대상여부, 13: 검진결과등록, 14: 검진종류, 15: 검진결과동의
 * 16: 보건관리자제공동의(결과), 17: 종합판정, 18: 검진소견암호화내용
 * 19: 수축기혈압, 20: 이완기혈압, 21: 고혈압판정
 * 22: 신장, 23: 체중, 24: 허리둘레, 25: 체질량지수(BMI), 26: 비만판정
 * 27: 혈색소(Hb), 28: 빈혈판정, 29: 공복시혈당(FBS), 30: 당뇨판정
 * 31: 총콜레스테롤, 32: LDL콜레스테롤, 33: HDL콜레스테롤, 34: 중성지방(TG), 35: 이상지질혈증판정
 * 36: AST(SGOT), 37: ALT(SGPT), 38: r-GTP(GGT), 39: 간질환판정
 * 40: 크레아티닌, 41: 요단백수치, 42: 요단백, 43: 신사구체여과율(GFR), 44: 신장질환판정
 * 45: 시력(좌), 46: 시력(우), 47: 흉부X선, 48: 청력(좌), 49: 청력(우)
 */
const FIXED_COLUMNS_BEFORE_DATE: Record<string, number> = {
  branch: 0,          // 사업장명
  employmentStatus: 1, // 재직상태
  name: 2,            // 이름
  employeeId: 3,      // 사번
  // 4: 등급
  birthDate: 5,       // 생년월일
  gender: 6,          // 성별
  age: 7,             // 기준나이
  phone: 8,           // 휴대폰번호
  examInstitution: 9, // 검진기관명
  reservationStatus: 10, // 예약상태
}

// 검진일 이후 상대 오프셋 (검진일 = 기준점 0)
const OFFSETS_AFTER_DATE: Record<string, number> = {
  // +1: 공단대상여부, +2: 검진결과등록
  examType: 3,            // 검진종류
  // +4: 검진결과동의, +5: 보건관리자제공동의(결과)
  result: 6,              // 종합판정
  // +7: 검진소견암호화내용
  systolicBP: 8,          // 수축기혈압
  diastolicBP: 9,         // 이완기혈압
  hypertensionResult: 10, // 고혈압판정
  // +11: 신장, +12: 체중, +13: 허리둘레
  bmi: 14,                // 체질량지수(BMI)
  obesityResult: 15,      // 비만판정
  hemoglobin: 16,         // 혈색소(Hb)
  anemiaResult: 17,       // 빈혈판정
  fastingGlucose: 18,     // 공복시혈당(FBS)
  diabetesResult: 19,     // 당뇨판정
  // +20: 총콜레스테롤
  ldlCholesterol: 21,     // LDL콜레스테롤
  // +22: HDL콜레스테롤, +23: 중성지방(TG)
  dyslipidemiaResult: 24, // 이상지질혈증판정
  ast: 25,                // AST(SGOT)
  alt: 26,                // ALT(SGPT)
  gtp: 27,                // r-GTP(GGT)
  liverResult: 28,        // 간질환판정
  // +29: 크레아티닌, +30: 요단백수치, +31: 요단백
  gfr: 32,                // 신사구체여과율(GFR)
  kidneyResult: 33,       // 신장질환판정
  // +34: 시력(좌), +35: 시력(우)
  chestXray: 36,          // 흉부X선
}

/**
 * 날짜 형식인지 확인 (YYYY-MM-DD 또는 YYYY.MM.DD 또는 YYYY/MM/DD)
 */
function isDateValue(value: string): boolean {
  if (!value) return false
  return /^\d{4}[-./]\d{2}[-./]\d{2}$/.test(value.trim())
}

/**
 * 헤더 없는 데이터에서 검진일 위치를 찾아 고정 컬럼 맵 생성
 */
function buildFixedColumnMap(firstRowCells: string[]): Record<string, number> {
  const mapping: Record<string, number> = { ...FIXED_COLUMNS_BEFORE_DATE }
  
  // 검진기관명(idx 9) 이후에서 날짜 형식을 찾아 검진일 위치 결정
  let examDateIdx = -1
  for (let i = 10; i < Math.min(firstRowCells.length, 15); i++) {
    if (isDateValue(firstRowCells[i])) {
      examDateIdx = i
      break
    }
  }
  
  // 날짜를 못 찾으면 기본값 11 사용
  if (examDateIdx === -1) examDateIdx = 11
  
  mapping.examDate = examDateIdx
  
  // 검진일 이후 오프셋 적용
  for (const [field, offset] of Object.entries(OFFSETS_AFTER_DATE)) {
    mapping[field] = examDateIdx + offset
  }
  
  return mapping
}

function mapHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    for (let i = 0; i < headers.length; i++) {
      if (mapping[field] !== undefined) break
      const header = headers[i]?.trim().replace(/\s+/g, "")
      if (!header) continue
      // 정확 매칭 우선, 그 다음 포함 매칭
      if (aliases.some(alias => {
        const a = alias.toLowerCase().replace(/\s+/g, "")
        const h = header.toLowerCase()
        return h === a || h.includes(a)
      })) {
        mapping[field] = i
        break
      }
    }
  }
  return mapping
}

/**
 * 첫 번째 행이 헤더인지 데이터인지 판별
 * - 헤더: 한글 텍스트로 된 컬럼명 (사번, 이름, 검진일 등)
 * - 데이터: 실제 값 (AD6148909, 강희경, 2026-03-26 등)
 */
function isHeaderRow(cells: string[]): boolean {
  // 알려진 헤더 키워드가 3개 이상 포함되면 헤더로 판단
  const headerKeywords = [
    "사번", "이름", "성명", "검진일", "사업장명", "휴대폰번호", "연락처",
    "수축기혈압", "이완기혈압", "공복시혈당", "혈색소", "종합판정", "체질량지수",
    "AST", "ALT", "GTP", "GFR", "LDL", "콜레스테롤",
    "기준나이", "성별", "재직상태", "검진기관명", "고혈압판정", "당뇨판정",
    "간질환판정", "빈혈판정", "신장질환판정", "이상지질혈증판정", "비만판정",
    "예약상태", "생년월일"
  ]
  
  let matchCount = 0
  for (const cell of cells) {
    const trimmed = cell.trim()
    if (!trimmed) continue
    // 정확히 키워드와 일치하거나 키워드를 포함하는 경우만 (짧은 데이터 값과 혼동 방지)
    if (headerKeywords.some(kw => trimmed === kw || (trimmed.length > 2 && trimmed.includes(kw)))) {
      matchCount++
    }
  }
  return matchCount >= 5
}

export async function POST(request: NextRequest) {
  try {
    const { data, uploadedBy } = await request.json()

    if (!data || !data.trim()) {
      return NextResponse.json({ error: "데이터를 입력해주세요." }, { status: 400 })
    }

    // 탭 또는 쉼표로 구분된 데이터 파싱
    const lines = data.split("\n").filter((line: string) => line.trim())

    if (lines.length < 1) {
      return NextResponse.json(
        { error: "최소 1행의 데이터가 필요합니다." },
        { status: 400 }
      )
    }

    // 구분자 감지 (탭 우선, 없으면 쉼표)
    const separator = lines[0].includes("\t") ? "\t" : ","

    const firstRowCells = lines[0].split(separator).map((h: string) => h.trim())
    
    // 헤더 여부 판별
    const hasHeader = isHeaderRow(firstRowCells)
    let columnMapping: Record<string, number>
    let dataStartIndex: number

    if (hasHeader) {
      // 헤더가 있으면 헤더 기반 매핑
      columnMapping = mapHeaders(firstRowCells)
      dataStartIndex = 1
    } else {
      // 헤더가 없으면 첫 번째 데이터 행으로 검진일 위치를 감지하여 고정 컬럼 맵 생성
      columnMapping = buildFixedColumnMap(firstRowCells)
      dataStartIndex = 0
    }

    const results: HealthCheckResult[] = []

    for (let i = dataStartIndex; i < lines.length; i++) {
      const cells = lines[i].split(separator).map((c: string) => c.trim())
      if (cells.length < 3) continue

      const getValue = (field: string): string => {
        const idx = columnMapping[field]
        if (idx === undefined) return ""
        return cells[idx] || ""
      }

      const getNumValue = (field: string): number | undefined => {
        const val = getValue(field)
        if (!val) return undefined
        const num = parseFloat(val)
        return isNaN(num) ? undefined : num
      }

      const name = getValue("name")
      const employeeId = getValue("employeeId")
      if (!name && !employeeId) continue

      const result: HealthCheckResult = {
        id: `hc-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        employeeId: employeeId || `EMP${String(i).padStart(4, "0")}`,
        name: name || "미상",
        department: "아성다이소",
        branch: getValue("branch"),
        phone: getValue("phone"),
        examDate: getValue("examDate") || new Date().toISOString().split("T")[0],
        birthDate: getValue("birthDate"),
        age: getNumValue("age"),
        gender: getValue("gender"),
        systolicBP: getNumValue("systolicBP"),
        diastolicBP: getNumValue("diastolicBP"),
        fastingGlucose: getNumValue("fastingGlucose"),
        ldlCholesterol: getNumValue("ldlCholesterol"),
        bmi: getNumValue("bmi"),
        ast: getNumValue("ast"),
        alt: getNumValue("alt"),
        gtp: getNumValue("gtp"),
        hemoglobin: getNumValue("hemoglobin"),
        gfr: getNumValue("gfr"),
        cvdRisk: getNumValue("cvdRisk"),
        chestXray: getValue("chestXray"),
        result: getValue("result"),
        findings: getValue("findings"),
        hypertensionResult: getValue("hypertensionResult"),
        diabetesResult: getValue("diabetesResult"),
        dyslipidemiaResult: getValue("dyslipidemiaResult"),
        liverResult: getValue("liverResult"),
        anemiaResult: getValue("anemiaResult"),
        kidneyResult: getValue("kidneyResult"),
        obesityResult: getValue("obesityResult"),
        examInstitution: getValue("examInstitution"),
        examType: getValue("examType"),
        reservationStatus: getValue("reservationStatus"),
        employmentStatus: getValue("employmentStatus"),
      }

      results.push(result)
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "파싱된 데이터가 없습니다. 데이터 형식을 확인해주세요." },
        { status: 400 }
      )
    }

    // 상담 대상자 자동 분류
    const targets = classifyTargets(results)
    await addTargets(targets)

    // 업로드 이력
    const uploadRecord: UploadHistory = {
      id: `upload-${Date.now()}`,
      fileName: "붙여넣기 입력",
      uploadDate: new Date().toISOString(),
      totalRecords: results.length,
      targetCount: targets.length,
      uploadedBy: uploadedBy || "admin",
    }
    await addUploadHistory(uploadRecord)

    const elderlyCount = targets.filter(t => t.riskLevel === "elderly").length
    const highRiskCount = targets.filter(t => t.riskLevel === "high").length

    return NextResponse.json({
      success: true,
      totalRecords: results.length,
      targetCount: targets.length,
      elderlyCount,
      highRiskCount,
      moderateCount: targets.filter(t => t.riskLevel === "moderate").length,
    })
  } catch (error) {
    console.error("Paste upload error:", error)
    return NextResponse.json(
      { error: "데이터 처리 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
