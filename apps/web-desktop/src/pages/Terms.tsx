import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Lang = 'ru' | 'en'

const CONTENT = {
  ru: {
    title: 'Пользовательское соглашение NeoMovies',
    subtitle: 'Перед использованием сервиса ознакомься с условиями.',
    updated: 'Обновлено: 8 мая 2026',
    accept: 'Принимаю условия',
    decline: 'Не принимаю',
    language: 'Язык',
    denyMessage: 'Без принятия условий использование сайта недоступно.',
    sections: [
      {
        title: '1. Общие положения',
        text: 'Доступ к NeoMovies возможен только при принятии настоящего соглашения. Если ты не согласен с условиями, использование сервиса запрещено.',
      },
      {
        title: '2. Что делает сервис',
        text: 'NeoMovies предоставляет каталог фильмов и сериалов, метаданные, плееры и навигацию по контенту. Мы не размещаем у себя видеофайлы и не выступаем источником видеоконтента.',
      },
      {
        title: '3. Авторизация и профиль',
        text: 'Авторизация в NeoMovies выполняется через NeoID. Для профиля используются данные NeoID: имя, email и аватар. Мы не используем локальные пароли NeoMovies и не запрашиваем лишние персональные данные.',
      },
      {
        title: '4. Избранное и данные',
        text: 'Избранное синхронизируется с аккаунтом NeoID. Часть технических данных (например, история поиска и некоторые настройки) может храниться локально в браузере для работы интерфейса.',
      },
      {
        title: '5. Ответственность пользователя',
        text: 'Пользователь самостоятельно отвечает за правомерность просмотра контента в своей юрисдикции. Использование внешних источников и плееров осуществляется на свой риск.',
      },
      {
        title: '6. Изменения условий',
        text: 'Мы можем обновлять соглашение. Продолжение использования после публикации новой версии означает согласие с актуальной редакцией.',
      },
    ],
  },
  en: {
    title: 'NeoMovies Terms of Service',
    subtitle: 'Please review these terms before using the service.',
    updated: 'Updated: May 8, 2026',
    accept: 'Accept terms',
    decline: 'Decline',
    language: 'Language',
    denyMessage: 'You cannot use the site without accepting the terms.',
    sections: [
      {
        title: '1. General',
        text: 'Access to NeoMovies is available only after accepting these terms. If you do not agree, you must not use the service.',
      },
      {
        title: '2. Service scope',
        text: 'NeoMovies provides a catalog of movies and TV shows, metadata, player integrations, and content navigation. We do not host video files on our infrastructure.',
      },
      {
        title: '3. Authentication and profile',
        text: 'Authentication is performed via NeoID. Profile data is sourced from NeoID: name, email, and avatar. We do not use separate NeoMovies passwords or request excessive personal data.',
      },
      {
        title: '4. Favorites and data',
        text: 'Favorites are synced with your NeoID account. Some technical data (for example search history and certain settings) may be stored locally in the browser for UI functionality.',
      },
      {
        title: '5. User responsibility',
        text: 'Users are responsible for compliance with local laws regarding content consumption. Use of external sources and players is at your own risk.',
      },
      {
        title: '6. Terms updates',
        text: 'We may update these terms. Continued use of the service after publication of a new version means acceptance of the current revision.',
      },
    ],
  },
} as const

export const Terms = () => {
  const navigate = useNavigate()
  const [lang, setLang] = useState<Lang>('ru')
  const t = CONTENT[lang]

  const handleAccept = () => {
    localStorage.setItem('acceptedTerms', 'true')
    navigate('/')
  }

  const handleDecline = () => {
    localStorage.setItem('acceptedTerms', 'false')
    alert(t.denyMessage)
  }

  return (
    <section className="terms-shell mx-auto max-w-[1100px] px-6 py-10">
      <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <h1 className="text-[34px] font-black tracking-[-0.04em] text-white">{t.title}</h1>
            <p className="text-sm text-zinc-400">{t.subtitle}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{t.updated}</p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{t.language}</div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`rounded-full px-3 py-1.5 text-sm transition ${lang === 'ru' ? 'bg-white text-[#07090d]' : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'}`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`rounded-full px-3 py-1.5 text-sm transition ${lang === 'en' ? 'bg-white text-[#07090d]' : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {t.sections.map((section) => (
            <article key={section.title} className="rounded-[22px] border border-white/8 bg-white/[0.02] p-5">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-400">{section.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="inline-flex h-11 items-center rounded-full border border-white/12 bg-white/[0.03] px-5 text-sm font-medium text-zinc-300 transition hover:border-white/16 hover:bg-white/[0.06] hover:text-white"
          >
            {t.decline}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#07090d] transition hover:bg-zinc-200"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </section>
  )
}
