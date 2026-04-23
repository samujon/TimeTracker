import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Storage Notice | Time Tracker",
  description: "Cookie and browser storage notice for Time Tracker.",
};

const storageItems = [
  {
    title: "Supabase auth cookies",
    purpose: "Required to sign in, keep your session active, refresh auth tokens, and let protected routes verify the current user.",
  },
  {
    title: "Optional preference storage",
    purpose: "Not used by default. Theme choice and sidebar state stay in memory for the current session only and are not saved on the device.",
  },
  {
    title: "Analytics and marketing storage",
    purpose: "Not used. This app does not ship analytics, advertising, or marketing cookies.",
  },
];

export default function StorageNoticePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-12 text-[var(--color-text)]">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Storage notice
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Time Tracker cookies and browser storage</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
          >
            Back to app
          </Link>
        </div>

        <p className="mt-6 text-sm leading-6 text-[var(--color-text-secondary)]">
          This app is designed to avoid a full consent banner by default. It keeps browser storage limited to cookies that are needed for authentication and session security.
        </p>

        <div className="mt-8 space-y-4">
          {storageItems.map((item) => (
            <section
              key={item.title}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4"
            >
              <h2 className="text-sm font-semibold text-[var(--color-text)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item.purpose}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-xl border border-[var(--color-border)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">What happens when you sign in</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Supabase sets auth cookies after a successful sign-in. The app refreshes those cookies during normal use so your session does not silently expire while you are active. After Google sign-in, Google may also set provider-managed cookies as part of the OAuth flow you requested.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-[var(--color-border)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">What is not stored on your device</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Theme selection, sidebar collapse state, analytics identifiers, and marketing preferences are not persisted in localStorage, sessionStorage, or IndexedDB in the default app.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-[var(--color-border)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Operator note</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            If you run a hosted version of this app and later add analytics, error reporting, embedded media, chat widgets, or other third-party scripts, review your cookie and consent obligations again before release.
          </p>
        </section>
      </div>
    </main>
  );
}
