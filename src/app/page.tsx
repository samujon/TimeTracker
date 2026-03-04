import { TimeTracker } from "@/components/TimeTracker";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-3xl space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl shadow-black/40">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Time Tracker</h1>
            <p className="mt-1 text-xs text-zinc-400">Minimal, self-hosted tracking powered by Supabase.</p>
          </div>
          <Link href="/stats" className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 transition">View Stats →</Link>
        </header>
        <TimeTracker />
      </div>
    </div>
  );
}
