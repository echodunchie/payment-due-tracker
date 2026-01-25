'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AdPlaceholderProps {
  type?: 'banner' | 'rectangle' | 'sidebar'
  className?: string
}

export function AdPlaceholder({ type = 'banner', className }: AdPlaceholderProps) {
  const adStyles = {
    banner: 'h-24 w-full',
    rectangle: 'h-64 w-full max-w-sm',
    sidebar: 'h-96 w-48'
  }

  return (
    <Card className={cn(
      'border-dashed border-2 border-muted-foreground/20 bg-muted/10 flex items-center justify-center',
      adStyles[type],
      className
    )}>
      <div className="text-center text-muted-foreground">
        <div className="text-xs font-medium mb-1">Advertisement</div>
        <div className="text-xs opacity-60">{type} placeholder</div>
      </div>
    </Card>
  )
}