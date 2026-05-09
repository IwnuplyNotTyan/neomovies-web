import * as React from 'react'
import { cn } from '../lib/utils'

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning'

const toneClass: Record<BadgeTone, string> = {
  neutral: 'border-white/10 bg-white/5 text-zinc-200',
  accent: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide',
        toneClass[tone],
        className,
      )}
    />
  )
}
