import { HealthCheckResult, ConsultationTarget, RiskLevel, HighRiskCriteria, ConsultationCycleSettings } from "@/types"

// 고위험 기준 (2026.02.06 업데이트 기준)
export const HIGH_RISK_CRITERIA: HighRiskCriteria = {
  systolicBP: 160,       // 수축기혈압 > 160
  diastolicBP: 100,      // 이완기혈압 > 100
  fastingGlucose: 250,   // 식전혈당 > 250
  ldlCholesterol: 190,   // LDL콜레스테롤 > 190
  totalGlucose: 500,     // 공복혈당 > 500
  ast: 250,              // AST > 250
  alt: 225,              // ALT > 225
  gtp: 200,              // r-GTP > 200
  hemoglobin: 8,         // 혈색소 < 8
  gfr: 30,              // GFR < 30
  cvdRisk: 10,           // 심뇌혈관위험도 >= 10%
}

// 고령자 기준 나이 (만 55세 이상, 1971년 이전 출생)
export const ELDERLY_AGE_THRESHOLD = 55

// 기본 상담 주기 설정
// - 고령자: 3개월(90일) - "60세 이상 고위험군은 3개월마다 주기적 전화상담"
// - 고위험(고령제외): 3개월(90일)
// - 일반관리: 1개월(30일)
// - 확인필요: 2개월(60일)
export const DEFAULT_CYCLE_SETTINGS: ConsultationCycleSettings = {
  highRiskCycleDays: 90,     // 고위험/고령자: 3개월
  moderateCycleDays: 30,     // 일반관리: 1개월
  lowCycleDays: 60,          // 확인필요: 2개월 (관리자 변경 가능)
}

// 유소견 항목별 상담 내용 매핑
export const FINDINGS_GUIDANCE: Record<string, { category: string; guidance: string }> = {
  "고혈압": {
    category: "고혈압",
    guidance: "혈압 관리 안내, 병원 방문 권고, 약물 복용 확인, 생활습관(저염식, 운동) 안내"
  },
  "당뇨": {
    category: "당뇨",
    guidance: "혈당 관리 안내, 병원 방문 권고, 약물 복용 확인, 식이요법 안내"
  },
  "고지혈증": {
    category: "고지혈증/이상지질혈증",
    guidance: "콜레스테롤 관리 안내, 병원 방문 권고, 식이요법 및 운동 안내"
  },
  "이상지질혈증": {
    category: "고지혈증/이상지질혈증",
    guidance: "콜레스테롤 관리 안내, 병원 방문 권고, 식이요법 및 운동 안내"
  },
  "간질환": {
    category: "간질환",
    guidance: "간 기능 관리 안내, 병원 방문 권고, 음주 절제 안내"
  },
  "빈혈": {
    category: "빈혈",
    guidance: "빈혈 관리 안내, 병원 방문 권고, 철분 섭취 안내"
  },
  "신장질환": {
    category: "신장질환",
    guidance: "신장 기능 관리 안내, 병원 방문 권고, 수분 섭취 및 식이 안내"
  },
  "흉부질환": {
    category: "흉부질환",
    guidance: "흉부 질환 관리 안내, 병원 방문 권고, 추가 검사 안내"
  },
  "심뇌혈관질환": {
    category: "심뇌혈관질환",
    guidance: "심뇌혈관 위험도 관리 안내, 병원 방문 권고, 생활습관 개선 안내"
  },
  "비만": {
    category: "비만",
    guidance: "체중 관리 안내, 식이요법 및 운동 안내, 생활습관 개선 안내"
  },
}

// 판정 결과 값 중 상담 대상에 해당하는 값들
// "유질환자" = 고위험 (이미 질환 확진)
// "요관찰자(질환의심)" = 일반관리 (질환 의심, 추적 관찰 필요)
const HIGH_RISK_RESULTS = ["유질환자"]
const MODERATE_RESULTS = ["요관찰자(질환의심)", "질환의심", "요관찰자(경계)", "경계"]

/**
 * 판정 결과가 상담 대상인지 확인
 */
function isAbnormalResult(value: string | undefined): "high" | "moderate" | null {
  if (!value || !value.trim()) return null
  const trimmed = value.trim()
  if (HIGH_RISK_RESULTS.some(r => trimmed.includes(r))) return "high"
  if (MODERATE_RESULTS.some(r => trimmed.includes(r))) return "moderate"
  return null
}

/**
 * 건강검진 결과를 분석하여 상담 대상자를 자동 분류
 * 
 * 분류 기준:
 * 1. 고령자 (만 55세 이상):
 *    - 고혈압/당뇨/이상지질혈증: "질환의심"(요관찰자) 이상이면 분류
 *    - 빈혈/간질환/신장질환: "고위험" 수치 기준 초과 시 분류
 * 2. 고위험군 (고령 제외, 55세 미만):
 *    - 모든 항목: "고위험" 수치 기준 초과 시 분류
 * 
 * 공통 제외:
 * - 비만만 단독 해당 → 제외 (다른 질환 동반 시에만 포함)
 * - 흉부질환만 해당 → 제외
 */
export function classifyTargets(results: HealthCheckResult[]): ConsultationTarget[] {
  const targets: ConsultationTarget[] = []

  for (const result of results) {
    // 검진일이 없는 경우 건너뛰기 (미검진자)
    if (!result.examDate || result.examDate === "") continue

    const age = result.age || 0
    const isElderly = age >= ELDERLY_AGE_THRESHOLD

    const findings: string[] = []
    const reasons: string[] = []
    let hasObesity = false

    if (isElderly) {
      // === 고령자 분류 ===
      // 고혈압/당뇨/이상지질혈증: 질환의심 수준 수치 기준
      // (정상B 초과 = 수축기 140 이상, 이완기 90 이상, 공복혈당 126 이상, LDL 160 이상)
      
      // 고혈압 - 수축기 140 이상 또는 이완기 90 이상
      if (result.systolicBP && result.systolicBP >= 140) {
        findings.push("고혈압")
        reasons.push(`수축기혈압 ${result.systolicBP}mmHg`)
      }
      if (result.diastolicBP && result.diastolicBP >= 90) {
        if (!findings.includes("고혈압")) findings.push("고혈압")
        reasons.push(`이완기혈압 ${result.diastolicBP}mmHg`)
      }

      // 당뇨 - 공복혈당 126 이상
      if (result.fastingGlucose && result.fastingGlucose >= 126) {
        findings.push("당뇨")
        reasons.push(`공복혈당 ${result.fastingGlucose}mg/dL`)
      }

      // 이상지질혈증 - LDL 160 이상
      if (result.ldlCholesterol && result.ldlCholesterol >= 160) {
        findings.push("이상지질혈증")
        reasons.push(`LDL콜레스테롤 ${result.ldlCholesterol}mg/dL`)
      }

      // 빈혈 - 혈색소 8 미만 (고위험 수치)
      if (result.hemoglobin && result.hemoglobin < HIGH_RISK_CRITERIA.hemoglobin) {
        findings.push("빈혈")
        reasons.push(`혈색소 ${result.hemoglobin}g/dL`)
      }

      // 간질환 - AST>250, ALT>225, r-GTP>200 (고위험 수치)
      if (result.ast && result.ast > HIGH_RISK_CRITERIA.ast) {
        findings.push("간질환")
        reasons.push(`AST ${result.ast}U/L`)
      }
      if (result.alt && result.alt > HIGH_RISK_CRITERIA.alt) {
        if (!findings.includes("간질환")) findings.push("간질환")
        reasons.push(`ALT ${result.alt}U/L`)
      }
      if (result.gtp && result.gtp > HIGH_RISK_CRITERIA.gtp) {
        if (!findings.includes("간질환")) findings.push("간질환")
        reasons.push(`r-GTP ${result.gtp}U/L`)
      }

      // 신장질환 - GFR 30 미만 (고위험 수치)
      if (result.gfr && result.gfr < HIGH_RISK_CRITERIA.gfr) {
        findings.push("신장질환")
        reasons.push(`GFR ${result.gfr}mL/min`)
      }

      // 심뇌혈관질환 - 발병위험도 10% 이상
      if (result.cvdRisk && result.cvdRisk >= HIGH_RISK_CRITERIA.cvdRisk) {
        findings.push("심뇌혈관질환")
        reasons.push(`심뇌혈관위험도 ${result.cvdRisk}%`)
      }

      // 비만 체크 (단독이면 제외, 동반 시에만 포함)
      const obesityLevel = isAbnormalResult(result.obesityResult)
      if (obesityLevel) {
        hasObesity = true
      }

    } else {
      // === 고위험군 (고령 제외) - 고위험 수치 기준 ===

      // 고혈압 - 수축기 160 초과, 이완기 100 초과
      if (result.systolicBP && result.systolicBP > HIGH_RISK_CRITERIA.systolicBP) {
        findings.push("고혈압")
        reasons.push(`수축기혈압 ${result.systolicBP}mmHg`)
      }
      if (result.diastolicBP && result.diastolicBP > HIGH_RISK_CRITERIA.diastolicBP) {
        if (!findings.includes("고혈압")) findings.push("고혈압")
        reasons.push(`이완기혈압 ${result.diastolicBP}mmHg`)
      }

      // 당뇨 - 공복혈당 250 초과
      if (result.fastingGlucose && result.fastingGlucose > HIGH_RISK_CRITERIA.fastingGlucose) {
        findings.push("당뇨")
        reasons.push(`공복혈당 ${result.fastingGlucose}mg/dL`)
      }

      // 이상지질혈증 - LDL 190 초과
      if (result.ldlCholesterol && result.ldlCholesterol > HIGH_RISK_CRITERIA.ldlCholesterol) {
        findings.push("이상지질혈증")
        reasons.push(`LDL콜레스테롤 ${result.ldlCholesterol}mg/dL`)
      }

      // 간질환 - AST>250, ALT>225, r-GTP>200
      if (result.ast && result.ast > HIGH_RISK_CRITERIA.ast) {
        findings.push("간질환")
        reasons.push(`AST ${result.ast}U/L`)
      }
      if (result.alt && result.alt > HIGH_RISK_CRITERIA.alt) {
        if (!findings.includes("간질환")) findings.push("간질환")
        reasons.push(`ALT ${result.alt}U/L`)
      }
      if (result.gtp && result.gtp > HIGH_RISK_CRITERIA.gtp) {
        if (!findings.includes("간질환")) findings.push("간질환")
        reasons.push(`r-GTP ${result.gtp}U/L`)
      }

      // 빈혈 - 혈색소 8 미만
      if (result.hemoglobin && result.hemoglobin < HIGH_RISK_CRITERIA.hemoglobin) {
        findings.push("빈혈")
        reasons.push(`혈색소 ${result.hemoglobin}g/dL`)
      }

      // 신장질환 - GFR 30 미만
      if (result.gfr && result.gfr < HIGH_RISK_CRITERIA.gfr) {
        findings.push("신장질환")
        reasons.push(`GFR ${result.gfr}mL/min`)
      }

      // 심뇌혈관질환 - 발병위험도 10% 이상
      if (result.cvdRisk && result.cvdRisk >= HIGH_RISK_CRITERIA.cvdRisk) {
        findings.push("심뇌혈관질환")
        reasons.push(`심뇌혈관위험도 ${result.cvdRisk}%`)
      }

      // 비만 체크 (단독이면 제외, 동반 시에만 포함)
      const obesityLevel = isAbnormalResult(result.obesityResult)
      if (obesityLevel) {
        hasObesity = true
      }
    }

    // === 제외 조건 체크 ===
    // 비만만 단독 → 제외 (다른 질환 동반 시에만 비만 추가)
    if (findings.length === 0 && hasObesity) {
      // 비만만 있고 다른 질환 없음 → 제외
      continue
    }
    if (findings.length > 0 && hasObesity) {
      // 다른 질환이 있으면 비만도 추가
      findings.push("비만")
      reasons.push(`비만판정: ${result.obesityResult}`)
    }

    // 흉부질환만 있는 경우 → 제외
    if (findings.length === 1 && findings[0] === "흉부질환") {
      continue
    }
    // 흉부질환만 남은 경우도 제외 (다른 항목이 모두 흉부질환인 경우)
    const nonChestFindings = findings.filter(f => f !== "흉부질환")
    if (findings.length > 0 && nonChestFindings.length === 0) {
      continue
    }

    // === 상담 대상자 분류 ===
    if (findings.length > 0) {
      const riskLevel: RiskLevel = isElderly ? "elderly" : "high"
      if (isElderly) {
        reasons.unshift(`만 55세 이상 고령자 (${age}세)`)
      }

      const target: ConsultationTarget = {
        id: crypto.randomUUID ? crypto.randomUUID() : `target-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        healthCheckId: result.id,
        employeeId: result.employeeId,
        name: result.name,
        department: result.department,
        branch: result.branch,
        phone: result.phone,
        birthDate: result.birthDate,
        examDate: result.examDate,
        findingsItems: findings,
        selectionReason: reasons.join("; "),
        riskLevel,
        progressStatus: "not_started",
        consultationPhase: "none",
        needFirstConsultation: true,
        needSecondConsultation: false,
        nextConsultationDate: null,
        status: "pending",
        consultations: [],
        evidences: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      targets.push(target)
    }
  }

  return targets
}

/**
 * 다음 상담일 자동 계산
 */
export function calculateNextConsultationDate(
  completedDate: string,
  riskLevel: RiskLevel,
  settings: ConsultationCycleSettings
): string {
  const date = new Date(completedDate)
  let daysToAdd: number

  switch (riskLevel) {
    case "elderly":
      daysToAdd = settings.highRiskCycleDays  // 고령자도 3개월
      break
    case "high":
      daysToAdd = settings.highRiskCycleDays
      break
    case "moderate":
      daysToAdd = settings.moderateCycleDays
      break
    case "low":
      daysToAdd = settings.lowCycleDays
      break
  }

  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().split("T")[0]
}
