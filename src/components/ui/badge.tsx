import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-800",
        high: "bg-red-50 text-red-600 border border-red-200",
        moderate: "bg-amber-50 text-amber-700 border border-amber-200",
        low: "bg-green-50 text-green-700 border border-green-200",
        today: "bg-blue-600 text-white",
        overdue: "bg-red-600 text-white",
        completed: "bg-green-600 text-white",
        pending: "bg-gray-100 text-gray-600 border border-gray-200",
        scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
