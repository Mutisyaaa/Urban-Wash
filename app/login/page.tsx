import type { Metadata } from "next";
import { AuthPanel } from "@/components/AuthPanel";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Urban Wash account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex-1 bg-[#F5F8FC] py-10 px-4 sm:px-6 lg:px-8">
      <AuthPanel
        initialMode="login"
        nextPath={params.next}
        callbackError={params.error === "auth_callback_failed"}
      />
    </main>
  );
}
