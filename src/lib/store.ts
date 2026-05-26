/**
 * 데이터 저장소 (JSON 파일 기반)
 * 사내 도구이므로 서버 사이드에서 JSON 파일로 데이터를 관리합니다.
 * 추후 DB로 마이그레이션 가능한 구조로 설계합니다.
 */
import { promises as fs } from "fs"
import path from "path"
import {
  ConsultationTarget,
  ConsultationRecord,
  ConsultationCycleSettings,
  UploadHistory,
  User,
} from "@/types"
import { DEFAULT_CYCLE_SETTINGS } from "./criteria"

const DATA_DIR = path.join(process.cwd(), "data")

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  try {
    const data = await fs.readFile(filePath, "utf-8")
    return JSON.parse(data) as T
  } catch {
    return defaultValue
  }
}

async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
}

// === 상담 대상자 ===
export async function getTargets(): Promise<ConsultationTarget[]> {
  return readJsonFile<ConsultationTarget[]>("targets.json", [])
}

export async function saveTargets(targets: ConsultationTarget[]): Promise<void> {
  await writeJsonFile("targets.json", targets)
}

export async function addTargets(newTargets: ConsultationTarget[]): Promise<void> {
  const existing = await getTargets()
  // 사번 기준으로 중복 체크 - 이미 있는 사람은 건너뛰고 기존 내역 유지
  const existingIds = new Set(existing.map(t => t.employeeId))
  const onlyNew = newTargets.filter(t => !existingIds.has(t.employeeId))
  const merged = [...existing, ...onlyNew]
  await writeJsonFile("targets.json", merged)
}

export async function updateTarget(targetId: string, updates: Partial<ConsultationTarget>): Promise<ConsultationTarget | null> {
  const targets = await getTargets()
  const index = targets.findIndex(t => t.id === targetId)
  if (index === -1) return null
  
  targets[index] = { ...targets[index], ...updates, updatedAt: new Date().toISOString() }
  await saveTargets(targets)
  return targets[index]
}

export async function deleteTargets(targetIds: string[]): Promise<number> {
  const targets = await getTargets()
  const idSet = new Set(targetIds)
  const remaining = targets.filter(t => !idSet.has(t.id))
  const deletedCount = targets.length - remaining.length
  await saveTargets(remaining)
  return deletedCount
}

export async function deleteAllTargets(): Promise<number> {
  const targets = await getTargets()
  const count = targets.length
  await saveTargets([])
  return count
}

// === 상담 기록 ===
export async function addConsultationRecord(targetId: string, record: ConsultationRecord): Promise<ConsultationTarget | null> {
  const targets = await getTargets()
  const index = targets.findIndex(t => t.id === targetId)
  if (index === -1) return null

  // 필드 초기화 (기존 데이터 호환)
  if (!targets[index].consultations) targets[index].consultations = []
  if (!targets[index].evidences) targets[index].evidences = []
  if (!targets[index].progressStatus) targets[index].progressStatus = "not_started"
  if (!targets[index].consultationPhase) targets[index].consultationPhase = "none"

  targets[index].consultations.push(record)
  targets[index].updatedAt = new Date().toISOString()

  // 연락불가 처리
  if (!record.callConnected) {
    targets[index].consultationPhase = "unreachable"
  } else {
    // 상담 단계 업데이트
    if (record.consultationType === "first") {
      targets[index].consultationPhase = "first_done"
      targets[index].needFirstConsultation = false
      targets[index].needSecondConsultation = true
    } else if (record.consultationType === "second") {
      targets[index].consultationPhase = "second_done"
      targets[index].needSecondConsultation = false
    }
  }

  // 다음 상담일 설정
  if (record.nextConsultationDate) {
    targets[index].nextConsultationDate = record.nextConsultationDate
    targets[index].status = "scheduled"
  }

  // 관리 완료 처리 (재상담 불필요 + 통화 연결됨)
  if (!record.needFollowUp && record.callConnected) {
    targets[index].progressStatus = "completed"
    targets[index].status = "completed"
    targets[index].nextConsultationDate = null
  }

  await saveTargets(targets)
  return targets[index]
}

// === 상담 기록 삭제 ===
export async function deleteConsultationRecord(targetId: string, recordId: string): Promise<ConsultationTarget | null> {
  const targets = await getTargets()
  const index = targets.findIndex(t => t.id === targetId)
  if (index === -1) return null

  if (!targets[index].consultations) targets[index].consultations = []
  targets[index].consultations = targets[index].consultations.filter(c => c.id !== recordId)
  targets[index].updatedAt = new Date().toISOString()

  // 상담 단계 재계산
  const consultations = targets[index].consultations
  if (consultations.length === 0) {
    targets[index].consultationPhase = "none"
    targets[index].needFirstConsultation = true
    targets[index].needSecondConsultation = false
    targets[index].progressStatus = "not_started"
  } else {
    const lastRecord = consultations[consultations.length - 1]
    if (!lastRecord.callConnected) {
      targets[index].consultationPhase = "unreachable"
    } else if (lastRecord.consultationType === "second") {
      targets[index].consultationPhase = "second_done"
      targets[index].needFirstConsultation = false
      targets[index].needSecondConsultation = false
    } else if (lastRecord.consultationType === "first") {
      targets[index].consultationPhase = "first_done"
      targets[index].needFirstConsultation = false
      targets[index].needSecondConsultation = true
    }
  }

  await saveTargets(targets)
  return targets[index]
}

// === 상담 주기 설정 ===
export async function getCycleSettings(): Promise<ConsultationCycleSettings> {
  return readJsonFile<ConsultationCycleSettings>("settings.json", DEFAULT_CYCLE_SETTINGS)
}

export async function saveCycleSettings(settings: ConsultationCycleSettings): Promise<void> {
  await writeJsonFile("settings.json", settings)
}

// === 업로드 이력 ===
export async function getUploadHistory(): Promise<UploadHistory[]> {
  return readJsonFile<UploadHistory[]>("uploads.json", [])
}

export async function addUploadHistory(upload: UploadHistory): Promise<void> {
  const history = await getUploadHistory()
  history.unshift(upload)
  await writeJsonFile("uploads.json", history)
}

// === 사용자 (관리자) ===
const DEFAULT_USERS: User[] = [
  { id: "1", username: "admin1", name: "관리자1", role: "admin" },
  { id: "2", username: "admin2", name: "관리자2", role: "admin" },
]

// 비밀번호는 별도 파일로 관리 (해시 저장)
interface UserCredential {
  username: string
  password: string // 실제 운영에서는 bcrypt 등으로 해시 처리 필요
}

const DEFAULT_CREDENTIALS: UserCredential[] = [
  { username: "admin1", password: "1111" },
  { username: "admin2", password: "1111" },
]

export async function getUsers(): Promise<User[]> {
  return readJsonFile<User[]>("users.json", DEFAULT_USERS)
}

export async function getCredentials(): Promise<UserCredential[]> {
  return readJsonFile<UserCredential[]>("credentials.json", DEFAULT_CREDENTIALS)
}

export async function validateLogin(username: string, password: string): Promise<User | null> {
  const credentials = await getCredentials()
  const cred = credentials.find(c => c.username === username && c.password === password)
  if (!cred) return null

  const users = await getUsers()
  return users.find(u => u.username === username) || null
}

// === 초기화 ===
export async function initializeData(): Promise<void> {
  await ensureDataDir()
  
  // 기본 사용자 데이터 생성
  try {
    await fs.access(path.join(DATA_DIR, "users.json"))
  } catch {
    await writeJsonFile("users.json", DEFAULT_USERS)
    await writeJsonFile("credentials.json", DEFAULT_CREDENTIALS)
    await writeJsonFile("settings.json", DEFAULT_CYCLE_SETTINGS)
  }
}
