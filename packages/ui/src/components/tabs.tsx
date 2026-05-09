import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '../lib/utils'

export const TabsRoot = Tabs.Root

export function TabsList({ className, ...props }: Tabs.TabsListProps) {
  return (
    <Tabs.List
      {...props}
      className={cn('inline-flex rounded-2xl border border-white/10 bg-white/5 p-1', className)}
    />
  )
}

export function TabsTrigger({ className, ...props }: Tabs.TabsTriggerProps) {
  return (
    <Tabs.Trigger
      {...props}
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition data-[state=active]:bg-white data-[state=active]:text-black',
        className,
      )}
    />
  )
}

export function TabsContent({ className, ...props }: Tabs.TabsContentProps) {
  return <Tabs.Content {...props} className={cn('mt-4 outline-none', className)} />
}
