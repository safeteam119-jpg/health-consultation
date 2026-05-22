// 건강검진 결과 데이터
export interface HealthCheckResult {
  id: string
  employeeId: string       // 사번
  name: string             // 성명/이름
  department: string       // 소속 (고객사명/사업장명)
  branch: string           // 사업장명 (매장/본사/부산허브센터)
  phone: string            // 연락처/휴대폰번호
  examDate: string         // 검진일
  birthDate?: string       // 생년월일
  age?: number             // 나이/기준나이
  gender?: string          // 성별
  systolicBP?: number      // 수축기혈압
  diastolicBP?: number     // 이완기혈압
  fastingGlucose?: number  // 공복시혈당(FBS)
  ldlCholesterol?: number  // LDL콜레스테롤
  bmi?: number             // 체질량지수(BMI)
  ast?: number             // AST(SGOT)
  alt?: number             // ALT(SGPT)
  gtp?: number             // r-GTP(GGT)
  hemoglobin?: number      // 혈색소(Hb)
  gfr?: number             // 신사구체여과율(GFR)
  cvdRisk?: number         // 심뇌혈관위험도 (%)
  chestXray?: string       // 흉부X선
  result?: string          // 종합판정
  findings?: string        // 유소견내용
  // 판정 컬럼들 (실제 엑셀 데이터)
  hypertensionResult?: string    // 고혈압판정
  diabetesResult?: string        // 당뇨판정
  dyslipidemiaResult?: string    // 이상지질혈증판정
  liverResult?: string           // 간질환판정
  anemiaResult?: string          // 빈혈판정
  kidneyResult?: string          // 신장질환판정
  obesityResult?: string         // 비만판정
  // 추가 메타 정보
  examInstitution?: string       // 검진기관명
  examType?: string              // 검진종류
  reservationStatus?: string     // 예약상태
  employmentStatus?: string      // 재직상태
}

// 위험도 분류
export type RiskLevel = "elderly" | "high" | "moderate" | "low"

// 진행 상태 (전체 관리 진행 상태)
export type ProgressStatus = "not_started" | "in_progress" | "completed"

// 상담 상태 (세부 상담 단계)
export type ConsultationPhase = "none" | "first_done" | "second_done" | "unreachable"

// 상담 상태 (레거시 호환 + D-Day 표시용)
export type ConsultationStatus = "pending" | "scheduled" | "today" | "overdue" | "completed" | "cancelled"

// 증빙자료
export interface Evidence {
  id: string
  imageData: string              // base64 이미지 데이터
  description: string            // 증빙자료 설명
  createdAt: string
}

// 상담 대상자
export interface ConsultationTarget {
  id: string
  healthCheckId: string
  employeeId: string
  name: string
  department: string
  branch: string
  phone: string
  birthDate?: string             // 생년월일
  examDate: string
  findingsItems: string[]        // 유소견 항목들
  selectionReason: string        // 상담대상 선정 사유
  riskLevel: RiskLevel           // 위험도/관리구분
  progressStatus: ProgressStatus // 진행중 / 완료
  consultationPhase: ConsultationPhase // 상담 단계
  needFirstConsultation: boolean // 1차 상담 필요 여부
  needSecondConsultation: boolean // 2차 상담 필요 여부
  nextConsultationDate: string | null // 다음 상담 예정일
  status: ConsultationStatus     // 상담 상태 (D-Day 표시용)
  consultations: ConsultationRecord[] // 상담 기록 이력
  evidences: Evidence[]          // 증빙자료
  createdAt: string
  updatedAt: string
}

// 상담 기록
export interface ConsultationRecord {
  id: string
  targetId: string
  consultationDate: string       // 상담일
  counselor: string              // 상담자
  callConnected: boolean         // 통화 여부
  healthRiskItems: string[]      // 주요 건강위험 항목
  consultationContent: string    // 상담 내용
  hospitalRecommended: boolean   // 병원 내원 권고 여부
  lifestyleGuidance: boolean     // 생활습관 개선 안내 여부
  needFollowUp: boolean          // 재상담 필요 여부
  managementStatus: "unmanaged" | "managed" | "" // 관리 상태 (미관리중/관리중)
  nextConsultationDate: string | null // 다음 상담 예정일
  notes: string                  // 비고
  consultationType: "first" | "second" | "follow-up" // 상담 유형
  createdAt: string
}

// 상담 주기 설정
export interface ConsultationCycleSettings {
  highRiskCycleDays: number      // 고위험 상담 주기 (일)
  moderateCycleDays: number      // 일반관리 상담 주기 (일)
  lowCycleDays: number           // 확인필요 상담 주기 (일)
}

// 유소견 판정 기준 (고위험)
export interface HighRiskCriteria {
  systolicBP: number       // 수축기혈압 > 160
  diastolicBP: number      // 이완기혈압 > 100
  fastingGlucose: number   // 식전혈당 > 250
  ldlCholesterol: number   // LDL콜레스테롤 > 190
  totalGlucose: number     // 공복혈당 > 500
  ast: number              // AST > 250
  alt: number              // ALT > 225
  gtp: number              // r-GTP > 200
  hemoglobin: number       // 혈색소 < 8
  gfr: number              // GFR < 30
  cvdRisk: number          // 심뇌혈관위험도 >= 10%
}

// 로그인 사용자
export interface User {
  id: string
  username: string
  name: string
  role: "admin"
}

// 업로드 이력
export interface UploadHistory {
  id: string
  fileName: string
  uploadDate: string
  totalRecords: number
  targetCount: number
  uploadedBy: string
}
