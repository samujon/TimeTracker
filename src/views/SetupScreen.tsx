import Link from "next/link";

export function SetupScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 shadow-xl shadow-black/10 dark:shadow-black/40">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect Supabase to start tracking time
        </h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          This app is self-hosted and uses your own Supabase project for
          storage. To finish setup, add your Supabase URL and anon public key to
          your environment.
        </p>

        <ol className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">1. Create a project</span>{" "}
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
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              2. Find your API URL and anon key
            </span>{" "}
            under{" "}
            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
              Settings → API
            </span>
            .
          </li>
          <li>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              3. Add them to your env file
            </span>{" "}
            in the root of this project:
            <pre className="mt-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200">
              {`# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key`}
            </pre>
          </li>
          <li>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              4. Apply the database schema
            </span>{" "}
            by running the SQL in{" "}
            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
              supabase/schema.sql
            </span>{" "}
            inside the Supabase SQL editor.
          </li>
          <li>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              5. Create your account
            </span>{" "}
            — once the app is running, a sign-in screen will appear. Sign up
            with an email address and password. Email/password auth is enabled
            by default in every Supabase project, so no extra dashboard config
            is needed.
          </li>
        </ol>

        <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
          Once saved, restart your dev server so the new environment variables
          are picked up. This screen will disappear automatically when the keys
          are configured.
        </p>
      </div>
    </div>
  );
}

