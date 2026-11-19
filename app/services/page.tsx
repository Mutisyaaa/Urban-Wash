import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ServiceGrid } from "@/components/ServiceGrid";
import type { ServiceRow } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Our Services & Pricing",
  description:
    "Explore Urban Wash laundry by weight, dry cleaning, duvet wash & dry, curtain cleaning, shoe restoration, and stain removal prices in Kenya.",
};

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const services: ServiceRow[] = data ?? [];

  return (
    <main className="flex-1 bg-[#F5F8FC]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-4xl">
            Our Services
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
            Choose from a wide range of professional laundry and dry cleaning
            services. Free doorstep pickup &amp; delivery on every order.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ServiceGrid services={services} showDescription />

        {/* Bulk Discount & Garment Care Callout */}
        <div className="mt-12 grid gap-6 rounded-3xl bg-[#0B1F3A] p-8 text-white shadow-lg lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/15 px-3 py-1 text-xs font-bold text-[#38BDF8]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Automatic 10kg+ Bulk Savings
            </span>
            <h2 className="mt-3 text-2xl font-extrabold">
              Wash 10kg or more &amp; pay KSh 180/kg instead of KSh 200/kg
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Great for weekly family laundry, hostel bundles, and Airbnb
              linens. Discount applies automatically in our booking calculator.
            </p>
            <ul className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-sky-100">
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                Free Pickup &amp; Delivery
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                3x6, 4x6 &amp; 5x6 Duvet Sizing
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                Optional Stain Pre-Treatment
              </li>
            </ul>
          </div>
          <div className="flex lg:justify-end">
            <Link
              href="/booking?service=laundry-by-weight"
              className="inline-flex items-center justify-center rounded-xl bg-[#1B75FF] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#145FD6]"
            >
              Calculate &amp; Book Now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
