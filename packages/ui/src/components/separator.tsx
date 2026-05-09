import * as Separator from '@radix-ui/react-separator'

export function UiSeparator(props: Separator.SeparatorProps) {
  return <Separator.Root {...props} className={`bg-zinc-200 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px ${props.className ?? ''}`} />
}
