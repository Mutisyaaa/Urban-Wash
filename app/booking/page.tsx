import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BookingWizard } from "@/components/BookingWizard";
import type { ProfileRow, ServiceRow } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Book a Laundry Pickup",
  description:
    "Schedule free laundry pickup and delivery in Kenya in 4 easy steps with live KSh pricing.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: servicesData }, { data: authData }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  let profile: ProfileRow | null = null;
  if (authData.user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();
    profile = data;
  }

  const services: ServiceRow[] = servicesData ?? [];

  return (
    <main className="flex-1 bg-[#F5F8FC] py-10 px-4 sm:px-6 lg:px-8">
      <BookingWizard
        services={services}
        initialServiceSlug={params.service}
        initialProfile={profile}
      />
    </main>
  );
}
