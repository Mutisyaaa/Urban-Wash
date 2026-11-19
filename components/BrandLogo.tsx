import React from "react";

interface BrandLogoProps {
  variant?: "light" | "dark";
  compact?: boolean;
  showTagline?: boolean;
}

export function BrandLogo({
  variant = "dark",
  compact = false,
  showTagline = true,
}: BrandLogoProps) {
  const titleColor = variant === "light" ? "text-white" : "text-[#0B1F3A]";
  const taglineColor =
    variant === "light" ? "text-sky-200/90" : "text-slate-500";

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#1B75FF] shadow-md shadow-blue-500/25">
        <svg
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
          className="h-7 w-7"
        >
          <path
            d="M18 4.5C18 4.5 9.5 13.8 9.5 20.5C9.5 25.19 13.31 29 18 29C22.69 29 26.5 25.19 26.5 20.5C26.5 13.8 18 4.5 18 4.5Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M12.5 20.5C14 19 16 19 18 20.5C20 22 22 22 23.5 20.5"
            stroke="#1B75FF"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="22.5" cy="11" r="1.7" fill="#BAE6FD" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={`font-extrabold tracking-tight ${
            compact ? "text-lg" : "text-xl"
          } ${titleColor}`}
        >
          Urban Wash
        </span>
        {showTagline && (
          <span className={`text-[11px] font-medium ${taglineColor}`}>
            Fresh Clothes. Happy You.
          </span>
        )}
      </span>
    </span>
  );
}
