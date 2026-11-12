"use client";

import React, { useEffect, useState } from "react";
import { CalendarRange, CircleAlert, ListChecks, TrendingUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  "not-member": "This Google account isn't on the team yet. Ask an admin to add you.",
  unverified: "Your Google account's email isn't verified.",
  state: "That sign-in link expired. Please try again.",
  session: "Your session ended. Please sign in again.",
  failed: "Sign-in failed. Please try again.",
};

const HIGHLIGHTS = [
  { icon: CalendarRange, title: "One calendar", text: "Every channel's posts planned in one place." },
  { icon: ListChecks, title: "Tasks and reviews", text: "Clear owners and approvals keep work moving." },
  { icon: TrendingUp, title: "Performance", text: "See what works and plan the next post on it." },
];

export function LoginCard({ error }: { error?: string }) {
  const message = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.failed) : null;

  return (
    // Stacked below lg: the header row takes only its content's height and sign-in gets the rest.
    // Without grid-rows the two rows would split the screen height evenly.
    <main className="grid min-h-dvh grid-rows-[auto_1fr] bg-background lg:grid-cols-2 lg:grid-rows-none">
      {/* Brand panel: a full column on large screens, a short header on phones. */}
      <aside className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-5 sm:gap-4 sm:px-8 sm:py-6 lg:justify-between lg:gap-8 lg:border-r lg:border-b-0 lg:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element -- a small SVG gains nothing from next/image */}
        <img src="/assets/logo-landscape.svg" alt="SCC Group" className="h-8 w-auto self-start object-contain sm:h-10 lg:h-12" />

        <div className="space-y-2 lg:space-y-8">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl lg:text-3xl">
              Plan, track and measure every post.
            </h2>
            <p className="max-w-md text-sm text-muted-foreground max-sm:hidden lg:text-base">
              Content Planner brings your channels, campaigns and team into one workspace.
            </p>
          </div>
          {/* Decorative, so phones skip it and get to the sign-in button sooner. */}
          <ul className="space-y-5 max-lg:hidden">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium text-foreground">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground max-lg:hidden">© {new Date().getFullYear()} SCC Group</p>
      </aside>

      <section className="flex items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to Content Planner with your work Google account.</p>
          </div>

          {message && (
            <div
              role="alert"
              className="flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <GoogleButton />

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Access is by invitation. Ask your admin to add your Google account.
          </p>
        </div>
      </section>
    </main>
  );
}

/** Google's standard sign-in button (light and dark variants from Google's branding guidelines). */
function GoogleButton() {
  const [redirecting, setRedirecting] = useState(false);

  // Coming back with the browser's Back button restores the page as it was; make the button usable again.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setRedirecting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <a
      href="/api/auth/google"
      aria-disabled={redirecting}
      onClick={(e) => {
        if (redirecting) e.preventDefault();
        else setRedirecting(true);
      }}
      className={cn(
        "flex h-10 w-full items-center justify-center gap-2.5 rounded-md border px-3 text-sm font-medium outline-none transition-colors",
        "border-[#747775] bg-white text-[#1F1F1F] hover:bg-[#F8F9FA]",
        "dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3] dark:hover:bg-[#1F1F21]",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        redirecting && "pointer-events-none opacity-70"
      )}
    >
      {redirecting ? <Spinner /> : <GoogleLogo />}
      {redirecting ? "Redirecting to Google…" : "Continue with Google"}
    </a>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-4.5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
