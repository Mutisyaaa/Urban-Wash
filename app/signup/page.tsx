import type { Metadata } from "next";
import { AuthPanel } from "@/components/AuthPanel";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Urban Wash Kenya customer account.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex-1 bg-[#F5F8FC] py-10 px-4 sm:px-6 lg:px-8">
      <AuthPanel initialMode="signup" nextPath={params.next} />
    </main>
  );
}
