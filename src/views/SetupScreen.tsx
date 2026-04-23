import Link from "next/link";

export function SetupScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 text-[var(--color-text)]">
      <div className="w-full max-w-xl rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect Supabase to start tracking time
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          This app is self-hosted and uses your own Supabase project for
          storage. To finish setup, add your Supabase URL and anon public key to
          your environment.
        </p>

        <ol className="mt-6 space-y-3 text-sm text-[var(--color-text-secondary)]">
          <li>
            <span className="font-medium text-[var(--color-text)]">1. Create a project</span>{" "}
            in{" "}
            <Link
              href="https://supabase.com/dashboard/projects"
              target="_blank"
              className="underline underline-offset-4"
            >
              Supabase Dashboard
            </Link>
            .
          </li>
          <li>
            <span className="font-medium text-[var(--color-text)]">
              2. Find your API URL and anon key
            </span>{" "}
            under{" "}
            <span className="font-mono text-xs bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded">
              Settings → API
            </span>
            .
          </li>
          <li>
            <span className="font-medium text-[var(--color-text)]">
              3. Add them to your env file
            </span>{" "}
            in the root of this project:
            <pre className="mt-2 rounded-lg bg-[var(--color-surface-alt)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
              {`# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key`}
            </pre>
          </li>
          <li>
            <span className="font-medium text-[var(--color-text)]">
              4. Apply the database schema
            </span>{" "}
            by running the SQL in{" "}
            <span className="font-mono text-xs bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded">
              supabase/schema.sql
            </span>{" "}
            inside the Supabase SQL editor.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text)]">
              5. Create your account
            </span>{" "}
            — once the app is running, a sign-in screen will appear. Sign up
            with an email address and password. Email/password auth is enabled
            by default in every Supabase project, so no extra dashboard config
            is needed.
          </li>
        </ol>

        <p className="mt-6 text-xs text-[var(--color-text-muted)]">
          Once saved, restart your dev server so the new environment variables
          are picked up. This screen will disappear automatically when the keys
          are configured.
        </p>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          For cookie and device storage details, see the{" "}
          <Link href="/storage" className="underline underline-offset-4 hover:text-[var(--color-text)]">
            storage notice
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

