import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Nav({ quiet = false }: { quiet?: boolean }) {
  return (
    <header className="no-print relative z-40 mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8">
      <Wordmark />
      <nav className="flex items-center gap-1 text-[0.95rem] text-paper-dim sm:gap-2">
        {!quiet && (
          <>
            <Link href="/#how" className="hidden rounded-full px-3 py-2 transition-colors hover:text-paper sm:inline-block">
              How it works
            </Link>
            <Link href="/people" className="rounded-full px-3 py-2 transition-colors hover:text-paper">
              Your people
            </Link>
          </>
        )}
        <Link href="/new" className="light-button rounded-full px-4 py-2 font-semibold">
          Start a profile
        </Link>
      </nav>
    </header>
  );
}
