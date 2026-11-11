"use client";

import React from "react";
import { CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  "not-member": "This Google account isn't on the team yet. Ask an admin to add you.",
  unverified: "Your Google account's email isn't verified.",
  state: "That sign-in link expired. Please try again.",
  session: "Your session ended. Please sign in again.",
  failed: "Sign-in failed. Please try again.",
};

export function LoginCard({ error }: { error?: string }) {
  const message = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.failed) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6 shadow-sm">
        <CardHeader className="p-0 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold tracking-tight">Marketing Ops</CardTitle>
          <CardDescription className="text-sm">Sign in to Content Planner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pt-4">
          {message && (
            <div
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {message}
            </div>
          )}
          <a href="/api/auth/google" className={cn(buttonVariants({ size: "default" }), "w-full justify-center")}>
            Sign in with Google
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
