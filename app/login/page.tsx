import type { Metadata } from "next";
import { LoginCard } from "@/features/team";

// The root layout's title template adds " · Content Planner".
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <LoginCard error={error} />;
}
