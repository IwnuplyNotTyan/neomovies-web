import * as Dialog from '@radix-ui/react-dialog'

export const DialogRoot = Dialog.Root
export const DialogTrigger = Dialog.Trigger
export const DialogPortal = Dialog.Portal
export const DialogClose = Dialog.Close
export const DialogTitle = Dialog.Title
export const DialogDescription = Dialog.Description

export function DialogOverlay(props: Dialog.DialogOverlayProps) {
  return <Dialog.Overlay {...props} className={`fixed inset-0 z-[100] bg-black/50 ${props.className ?? ''}`} />
}

export function DialogContent(props: Dialog.DialogContentProps) {
  return (
    <Dialog.Portal>
      <DialogOverlay />
      <Dialog.Content
        {...props}
        className={`fixed left-1/2 top-1/2 z-[101] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-[#0f131b] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${props.className ?? ''}`}
      />
    </Dialog.Portal>
  )
}
