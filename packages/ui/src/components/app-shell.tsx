import * as React from "react";
import { cn } from "../lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07090d] text-zinc-100">{children}</div>
  );
}

export function AppHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex justify-center px-5 pt-5">
      <div className="flex w-fit items-center gap-3 rounded-[22px] border border-white/12 bg-[#171b24] px-4 py-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/6">
        {children}
      </div>
    </header>
  );
}

export function AppMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto max-w-360 px-5 py-8", className)}>
      {children}
    </main>
  );
}

export function BrandMark() {
  return (
    <div className="inline-flex items-center rounded-[14px] bg-white/7 px-4 py-2 text-sm font-semibold tracking-tight text-white">
      NeoMovies
    </div>
  );
}

export function NavPill({
  active = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-[14px] px-4 py-2 text-sm font-medium tracking-tight transition-all duration-200",
        active
          ? "bg-white/9 text-white"
          : "bg-transparent text-zinc-300 hover:bg-white/7 hover:text-white",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

export function SearchField(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-[14px] border border-white/14 bg-[#0d1118] px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner shadow-black/20 focus:border-white/24",
        props.className,
      )}
    />
  );
}

export function UserPill({
  name,
  avatar,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  name: string;
  avatar?: string;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-[14px] bg-white/7 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10",
        props.className,
      )}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <span className="h-8 w-8 rounded-full bg-zinc-700" />
      )}
      <span>{name}</span>
    </button>
  );
}

export function StageSurface({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] shadow-[0_36px_120px_rgba(0,0,0,0.45)]">
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="text-4xl font-black tracking-[-0.06em] text-white md:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
