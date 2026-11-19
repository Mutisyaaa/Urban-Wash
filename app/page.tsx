import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/BrandLogo";
import { ServiceGrid } from "@/components/ServiceGrid";
import type { ServiceRow } from "@/lib/types/database";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const services: ServiceRow[] = data ?? [];

  return (
    <main className="flex-1">
      {/* ===================================================================
          Hero Section (LCP Image with fetchPriority="high", zero lazy-loading)
         =================================================================== */}
      <section className="relative overflow-hidden bg-[#0B1F3A] text-white">
        <img
          src="/images/hero-laundry.png"
          alt="Freshly folded white towels on a stainless-steel counter in front of modern laundry machines"
          fetchPriority="high"
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover object-right opacity-80"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#071529] via-[#0B1F3A]/90 to-[#0B1F3A]/45"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/15 px-3.5 py-1 text-xs font-semibold text-sky-200 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
              Same-Day Pickup Across Nairobi &amp; Kenya
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
              Professional Laundry &amp; Dry Cleaning Services{" "}
              <span className="text-[#38BDF8]">in Kenya</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Clean clothes, fresh vibes! We pick up, clean, and deliver right
              to your door. Fast, convenient and reliable.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B75FF]/25 text-[#38BDF8]">
                  <Truck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">
                    Free Pickup &amp; Delivery
                  </p>
                  <p className="text-[11px] text-slate-300">
                    At your convenience
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B75FF]/25 text-[#38BDF8]">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Quality Cleaning</p>
                  <p className="text-[11px] text-slate-300">
                    Gentle on your clothes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B75FF]/25 text-[#38BDF8]">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">On-Time Delivery</p>
                  <p className="text-[11px] text-slate-300">
                    Because you matter
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B75FF] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-[#145FD6]"
              >
                Book Now
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Our Services
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold text-sky-200 underline-offset-4 hover:text-white hover:underline"
              >
                Track an Order →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          Our Services Grid
         =================================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-4xl">
            Our Services
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Choose from a wide range of professional laundry and dry cleaning
            services with transparent KSh pricing.
          </p>
        </div>

        <div className="mt-10">
          <ServiceGrid services={services} />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1B75FF] hover:text-[#145FD6]"
          >
            View full pricing &amp; garment care guide →
          </Link>
        </div>
      </section>

      {/* ===================================================================
          How It Works
         =================================================================== */}
      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-white py-16 scroll-mt-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B75FF]">
              Simple 4-Step Process
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
              How Urban Wash Works
            </h2>
            <p className="mt-2 text-slate-600">
              Schedule in seconds, track every step live, and enjoy spotless
              laundry delivered back to your door.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Book a Pickup",
                desc: "Select your laundry service, choose a pickup date and time slot, and confirm in under 60 seconds.",
              },
              {
                step: "02",
                title: "Free Doorstep Collection",
                desc: "Our verified Urban Wash rider collects your laundry bag right from your home or office for free.",
              },
              {
                step: "03",
                title: "Expert Wash & Care",
                desc: "Sorted by color and fabric, washed with eco-friendly detergents, pressed, and neatly folded.",
              },
              {
                step: "04",
                title: "Fresh Delivery (24–48h)",
                desc: "Receive real-time status notifications and crisp, clean laundry returned straight to your door.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-[#F5F8FC] p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B75FF] text-sm font-extrabold text-white shadow-sm">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-bold text-[#0B1F3A]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          About Urban Wash Kenya
         =================================================================== */}
      <section
        id="about"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 scroll-mt-20"
      >
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B75FF]">
              Built for Modern Kenya
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
              Laundry care designed around your busy schedule
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Whether you&apos;re in Westlands, Kilimani, Karen, Kileleshwa, or
              the CBD, Urban Wash takes laundry off your weekend checklist. We
              combine modern commercial machines, fabric-safe solvents, and
              dependable local riders.
            </p>

            <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
              {[
                "10kg+ Laundry bulk discount: automatically drops from KSh 200/kg to KSh 180/kg",
                "Separate washes — your garments are never mixed with another customer's load",
                "Pay conveniently via M-Pesa STK or Cash on Delivery",
                "Live order tracking from pickup to doorstep delivery",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#1B75FF]"
                    aria-hidden="true"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Signature Brand Banner from Blueprint */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0B1F3A] p-8 text-white shadow-xl sm:p-10">
            <img
              src="/images/banner-bg.png"
              alt="Clean modern Urban Wash laundry studio interior"
              loading="lazy"
              width={1200}
              height={500}
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-[#071529]/90 via-[#0B1F3A]/80 to-[#1B75FF]/35"
            />

            <div className="relative space-y-7">
              <div className="flex justify-center sm:justify-start">
                <BrandLogo variant="light" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-2.5">
                  <Truck className="h-5 w-5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold">Free Pickup &amp; Delivery</p>
                    <p className="text-[11px] text-slate-300">At your convenience</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold">Quality Cleaning</p>
                    <p className="text-[11px] text-slate-300">Gentle on your clothes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold">On-Time Delivery</p>
                    <p className="text-[11px] text-slate-300">Because you matter</p>
                  </div>
                </div>
              </div>

              <p className="pt-2 text-center font-[family-name:var(--font-caveat)] text-4xl font-bold tracking-wide text-white sm:text-left">
                Clean. Fresh. Delivered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          Ready to Get Started CTA (Blueprint Contact Strip)
         =================================================================== */}
      <section
        id="contact"
        className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8 scroll-mt-20"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-2.5 max-w-md text-sm text-slate-600 sm:text-base">
            Book your laundry service today and enjoy a cleaner, fresher
            tomorrow.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4">
            <Link
              href="/booking"
              className="inline-flex min-w-52 items-center justify-center rounded-xl bg-[#1B75FF] px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#145FD6]"
            >
              Book Now
            </Link>
            <a
              href="tel:+254700123456"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#1B75FF]"
            >
              <Phone className="h-4 w-4 text-[#1B75FF]" aria-hidden="true" />
              <span>
                Or contact us:{" "}
                <strong className="text-[#0B1F3A]">0700 123 456</strong>
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
