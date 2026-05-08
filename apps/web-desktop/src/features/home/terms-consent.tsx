import { useMemo } from 'react'
import { Button } from '@neomovies/ui'

type Props = {
  accepted: boolean
  onAccept: () => void
}

export function TermsConsentGate({ accepted, onAccept }: Props) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  if (accepted) return null

  return (
    <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-zinc-100">
      <h2 className="text-lg font-semibold">Соглашение и авторизация NeoID</h2>
      <p className="mt-2 text-sm text-zinc-300">
        Для работы аккаунта используется NeoID: имя, email, аватар, а также токены авторизации.
        Последнее обновление условий: {today}.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
        <li>данные профиля (имя, email, аватар) загружаются после входа через NeoID;</li>
        <li>история просмотра и избранное синхронизируются с аккаунтом;</li>
        <li>без принятия условий доступ к основным разделам ограничен.</li>
      </ul>
      <Button className="mt-4" onClick={onAccept}>Принять и продолжить</Button>
    </section>
  )
}
