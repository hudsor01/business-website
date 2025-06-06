import React from 'react'
import { cn } from '@/src/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-900/10', className)}
      {...props}
    />
  )
}

export { Skeleton }
