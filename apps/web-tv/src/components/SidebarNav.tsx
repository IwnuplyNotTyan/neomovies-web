import { Film, Heart, Home, Search, Tv, User } from 'lucide-solid'

export function SidebarNav(props: { activeNav: () => number }) {
  return (
    <aside class="absolute left-6 top-6 z-[4] flex h-[90%] w-16 flex-col items-center py-2">
      <div class="mb-7 grid h-11 w-11 place-items-center rounded-full bg-black/28 ring-1 ring-white/20 backdrop-blur-sm"><User size={20} class="text-white/92" /></div>
      <div class="mt-11 flex flex-1 flex-col items-center gap-5">
        {[{ icon: Search, idx: 0 }, { icon: Home, idx: 1 }, { icon: Film, idx: 2 }, { icon: Tv, idx: 3 }, { icon: Heart, idx: 4 }].map((item) => (
          <div class={`grid h-11 w-11 place-items-center rounded-xl ${props.activeNav() === item.idx ? 'bg-white text-black' : 'text-white/72'}`}><item.icon size={20} class={props.activeNav() === item.idx ? 'text-black' : 'text-white/72'} /></div>
        ))}
      </div>
    </aside>
  )
}
