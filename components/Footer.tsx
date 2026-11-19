import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const ZONES = [
  "Westlands",
  "Kilimani",
  "Kileleshwa",
  "Karen",
  "Lavington",
  "Nairobi CBD",
  "Mombasa Rd",
  "Ruaka",
];

export function Footer() {
  return (
    <footer className="bg-[#0B1F3A] text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <BrandLogo variant="light" />
            <p className="text-sm leading-relaxed text-slate-300">
              Clean clothes, fresh vibes! Door-to-door laundry, dry cleaning, and
              duvet care trusted across Nairobi and Kenya.
            </p>
            <p className="font-[family-name:var(--font-caveat)] text-2xl font-bold text-[#38BDF8]">
              Clean. Fresh. Delivered.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/services" className="hover:text-[#38BDF8] transition">
                  Our Services &amp; Pricing
                </Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-[#38BDF8] transition">
                  Book a Free Pickup
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-[#38BDF8] transition">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#38BDF8] transition">
                  Customer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#38BDF8] transition">
                  Login / Sign Up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Kenya Pickup Zones
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {ZONES.map((zone) => (
                <li key={zone} className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <span>{zone}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Contact &amp; Hours
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href="tel:+254700123456"
                  className="inline-flex items-center gap-2 font-semibold text-white hover:text-[#38BDF8]"
                >
                  <Phone className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                  0700 123 456
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                <span>care@urbanwash.co.ke</span>
              </li>
              <li className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                <span>Mon – Sun: 7:00 AM – 8:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Urban Wash Kenya. All rights reserved.</p>
          <p>Free Pickup &amp; Delivery • Gentle Eco-Care • On-Time Guarantee</p>
        </div>
      </div>
    </footer>
  );
}
