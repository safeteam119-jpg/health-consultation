import * as XLSX from "xlsx"
import { HealthCheckResult } from "@/types"

// 엑셀 컬럼명 매핑 (실제 아성다이소 건강검진 엑셀 기준 + 다양한 형태 인식)
const COLUMN_MAPPINGS: Record<string, string[]> = {
  employeeId: ["사번", "사원번호", "직원번호", "ID", "사원ID"],
  name: ["이름", "성명", "성함", "직원명"],
  department: ["고객사명", "소속", "부서", "조직", "소속부서"],
  branch: ["사업장명", "매장명", "부서명", "매장", "지점", "지점명", "근무지"],
  phone: ["휴대폰번호", "연락처", "전화번호", "핸드폰", "휴대폰", "HP", "전화"],
  examDate: ["검진일", "검진일자", "건강검진일", "수검일", "검사일"],
  birthDate: ["생년월일", "생일", "출생일"],
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
  // 판정 컬럼들 (실제 엑셀에 있는 질환별 판정)
  hypertensionResult: ["고혈압판정", "고혈압"],
  diabetesResult: ["당뇨판정", "당뇨"],
  dyslipidemiaResult: ["이상지질혈증판정", "이상지질혈증"],
  liverResult: ["간질환판정", "간질환"],
  anemiaResult: ["빈혈판정", "빈혈"],
  kidneyResult: ["신장질환판정", "신장질환"],
  obesityResult: ["비만판정", "비만"],
  // 추가 메타 정보
  examInstitution: ["검진기관명", "검진기관", "병원명"],
  examType: ["검진종류", "검진유형"],
  reservationStatus: ["예약상태"],
  employmentStatus: ["재직상태"],
}

/**
 * 엑셀 컬럼명을 자동 매핑
 */
function mapColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}

  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]?.toString().trim().replace(/\s+/g, "")
      if (aliases.some(alias => 
        header.toLowerCase().includes(alias.toLowerCase().replace(/\s+/g, "")) ||
        alias.toLowerCase().replace(/\s+/g, "").includes(header.toLowerCase())
      )) {
        mapping[field] = i
        break
      }
    }
  }

  return mapping
}

/**
 * 엑셀 파일을 파싱하여 건강검진 결과 배열로 변환
 */
export function parseHealthCheckExcel(buffer: ArrayBuffer): {
  results: HealthCheckResult[]
  unmappedColumns: string[]
  totalRows: number
} {
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

  if (rawData.length < 2) {
    return { results: [], unmappedColumns: [], totalRows: 0 }
  }

  const headers = (rawData[0] as unknown[]).map(h => String(h || ""))
  const columnMapping = mapColumns(headers)

  // 매핑되지 않은 컬럼 확인
  const mappedIndices = new Set(Object.values(columnMapping))
  const unmappedColumns = headers.filter((_, i) => !mappedIndices.has(i) && headers[i]?.trim())

  const results: HealthCheckResult[] = []

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[]
    if (!row || row.length === 0) continue

    const getValue = (field: string): string => {
      const idx = columnMapping[field]
      if (idx === undefined) return ""
      const val = row[idx]
      if (val === null || val === undefined) return ""
      return String(val).trim()
    }

    const getNumValue = (field: string): number | undefined => {
      const val = getValue(field)
      if (!val) return undefined
      const num = parseFloat(val)
      return isNaN(num) ? undefined : num
    }

    const name = getValue("name")
    const employeeId = getValue("employeeId")
    
    // 이름이나 사번이 없으면 건너뛰기
    if (!name && !employeeId) continue

    const result: HealthCheckResult = {
      id: `hc-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      employeeId: employeeId || `EMP${String(i).padStart(4, "0")}`,
      name: name || "미상",
      department: getValue("department"),
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
      // 판정 컬럼들
      hypertensionResult: getValue("hypertensionResult"),
      diabetesResult: getValue("diabetesResult"),
      dyslipidemiaResult: getValue("dyslipidemiaResult"),
      liverResult: getValue("liverResult"),
      anemiaResult: getValue("anemiaResult"),
      kidneyResult: getValue("kidneyResult"),
      obesityResult: getValue("obesityResult"),
      // 추가 메타 정보
      examInstitution: getValue("examInstitution"),
      examType: getValue("examType"),
      reservationStatus: getValue("reservationStatus"),
      employmentStatus: getValue("employmentStatus"),
    }

    results.push(result)
  }

  return { results, unmappedColumns, totalRows: rawData.length - 1 }
}
