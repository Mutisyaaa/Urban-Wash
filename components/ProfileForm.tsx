"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/types/database";

export function ProfileForm({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [defaultAddress, setDefaultAddress] = useState(
    profile.default_address ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          default_address: defaultAddress.trim() || null,
        })
        .eq("id", profile.id);

      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Saved details auto-fill future Urban Wash pickups.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
      >
        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
          >
            {errorMsg}
          </div>
        )}

        {saved && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Profile saved successfully.
          </div>
        )}

        <div>
          <label
            htmlFor="profile-email"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Email Address
          </label>
          <input
            id="profile-email"
            type="email"
            disabled
            value={profile.email}
            className="uw-input bg-slate-50 text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="profile-name"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Full Name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="uw-input"
          />
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Phone Number
          </label>
          <input
            id="profile-phone"
            name="tel"
            type="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="uw-input"
          />
        </div>

        <div>
          <label
            htmlFor="profile-address"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Default Pickup Address
          </label>
          <input
            id="profile-address"
            name="street-address"
            type="text"
            autoComplete="street-address"
            placeholder="e.g. Apt 4B, Ring Road, Westlands, Nairobi"
            value={defaultAddress}
            onChange={(e) => setDefaultAddress(e.target.value)}
            className="uw-input"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B75FF] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#145FD6] disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
