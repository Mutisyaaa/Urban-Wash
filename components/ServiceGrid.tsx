import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ServiceIcon } from "@/components/ServiceIcon";
import type { ServiceRow } from "@/lib/types/database";

export function ServiceGrid({
  services,
  showDescription = false,
}: {
  services: ServiceRow[];
  showDescription?: boolean;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <article
          key={service.id}
          className="group relative flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white p-7 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1B75FF] ring-1 ring-blue-100 transition group-hover:bg-[#1B75FF] group-hover:text-white">
            <ServiceIcon iconKey={service.icon_key} className="h-7 w-7" />
          </div>

          <h3 className="text-lg font-bold text-[#0B1F3A]">{service.name}</h3>
          <p className="mt-1.5 text-base font-bold text-[#1B75FF]">
            {service.price_label}
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {service.subtitle}
          </p>

          {showDescription && (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {service.description}
            </p>
          )}

          <Link
            href={`/booking?service=${encodeURIComponent(service.slug)}`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2 text-xs font-bold text-[#0B1F3A] ring-1 ring-slate-200 transition group-hover:bg-[#1B75FF] group-hover:text-white group-hover:ring-[#1B75FF]"
          >
            <span>Book Now</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </article>
      ))}
    </div>
  );
}
