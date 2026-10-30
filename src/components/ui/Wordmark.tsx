import Link from "next/link";

/** The madeleine cake is baked in a scallop-shell mould, so the mark is a shell. */
export function ShellMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 29c-1.6 0-2.6-1.3-3.4-2.4C9 21.9 4 18.6 4 12.5 4 7.3 9.4 3 16 3s12 4.3 12 9.5c0 6.1-5 9.4-8.6 14.1-.8 1.1-1.8 2.4-3.4 2.4Z"
        fill="currentColor"
      />
      <g stroke="#1b1310" strokeWidth="1.3" strokeLinecap="round" opacity=".5" fill="none">
        <path d="M16 27V6" />
        <path d="M16 27 9.6 7.4" />
        <path d="M16 27 22.4 7.4" />
        <path d="M16 27 5.4 11.2" />
        <path d="M16 27 26.6 11.2" />
      </g>
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 text-paper" aria-label="Madeleine home">
      <ShellMark className="size-7 text-amber transition-transform duration-500 group-hover:-rotate-12" />
      <span className="display text-[1.65rem] leading-none">Madeleine</span>
    </Link>
  );
}
