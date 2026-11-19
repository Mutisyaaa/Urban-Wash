import type { Metadata } from "next";
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { SiteChrome } from "@/components/SiteChrome";
import type { ProfileRow } from "@/lib/types/database";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Urban Wash | Professional Laundry & Dry Cleaning Services in Kenya",
    template: "%s | Urban Wash Kenya",
  },
  description:
    "Clean clothes, fresh vibes! We pick up, clean, and deliver right to your door across Kenya. Fast, convenient and reliable laundry, dry cleaning, and duvet care.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialProfile: ProfileRow | null = null;
  let initialUnreadCount = 0;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
      ]);
      initialProfile = profile;
      initialUnreadCount = count ?? 0;
    }
  } catch {
    // Allow graceful fallback on static/error boundaries
  }

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F8FC] text-slate-900">
        <SiteChrome
          initialProfile={initialProfile}
          initialUnreadCount={initialUnreadCount}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
