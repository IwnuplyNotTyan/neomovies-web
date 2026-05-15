import { Film, Heart, Home, Search, Tv, User } from 'lucide-solid'
import './styles/Sidebar.css'

type SidebarProps = {
  activeItem: string
}

const items = [
  { key: 'search', icon: Search },
  { key: 'home', icon: Home },
  { key: 'movies', icon: Film },
  { key: 'tv', icon: Tv },
  { key: 'favorites', icon: Heart },
]

export function Sidebar(props: SidebarProps) {
  return (
    <aside class="sidebar" data-focus-section="sidebar">
      <div class="sidebar-top">
        <div class="sidebar-button sidebar-profile">
          <User size={24} />
        </div>
      </div>
      <div class="sidebar-nav">
        {items.map((item) => (
          <button
            type="button"
            class={`sidebar-button focusable ${props.activeItem === item.key ? 'is-active' : ''}`}
            data-nav-item={item.key}
            data-autofocus={props.activeItem === item.key ? 'true' : undefined}
          >
            <item.icon size={22} stroke-width={2.2} />
          </button>
        ))}
      </div>
    </aside>
  )
}
