"use client"

import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Search } from "lucide-react"

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  departmentFilter: string
  onDepartmentChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  departments: string[]
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
  sortBy,
  onSortChange,
  departments,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 검색 */}
      <div className="relative w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          placeholder="성명, 사번, 연락처"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      <Select value={departmentFilter} onChange={(e) => onDepartmentChange(e.target.value)}>
        <option value="">전체 사업장</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </Select>

      <Select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
        <option value="">전체 진행상태</option>
        <option value="not_started">미진행</option>
        <option value="in_progress">진행중</option>
        <option value="completed">완료</option>
      </Select>

      <Select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
        <option value="nextDate">상담 예정일순</option>
        <option value="risk">위험도 높은순</option>
        <option value="examDate">최근 검진일순</option>
        <option value="name">이름순</option>
      </Select>
    </div>
  )
}
