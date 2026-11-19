"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/types/database";

export function SettingsForm({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const [emailNotifs, setEmailNotifs] = useState(profile.email_notifications);
  const [smsNotifs, setSmsNotifs] = useState(profile.sms_notifications);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const savePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          email_notifications: emailNotifs,
          sms_notifications: smsNotifs,
        })
        .eq("id", profile.id);
      if (!error) {
        setPrefsMsg("Notification preferences updated.");
        router.refresh();
      }
    } finally {
      setSavingPrefs(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPwMsg(null);
    setPwError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setPwError(error.message);
        return;
      }
      setNewPassword("");
      setPwMsg("Password updated successfully.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your notification preferences and account security.
        </p>
      </div>

      <form
        onSubmit={savePreferences}
        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
      >
        <h2 className="text-lg font-bold text-[#0B1F3A]">
          Notification Channels
        </h2>

        {prefsMsg && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {prefsMsg}
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 p-4">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Email Order Updates
            </p>
            <p className="text-xs text-slate-500">
              Receive receipts and milestone emails when status changes.
            </p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifs}
            onChange={(e) => setEmailNotifs(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#1B75FF]"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 p-4">
          <div>
            <p className="text-sm font-bold text-slate-800">
              SMS / Rider Arrival Alerts
            </p>
            <p className="text-xs text-slate-500">
              Allow rider dispatch alerts to your registered phone number.
            </p>
          </div>
          <input
            type="checkbox"
            checked={smsNotifs}
            onChange={(e) => setSmsNotifs(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#1B75FF]"
          />
        </label>

        <button
          type="submit"
          disabled={savingPrefs}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B75FF] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#145FD6] disabled:opacity-60"
        >
          {savingPrefs && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Save Preferences
        </button>
      </form>

      <form
        onSubmit={updatePassword}
        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
      >
        <h2 className="text-lg font-bold text-[#0B1F3A]">Change Password</h2>

        {pwError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800"
          >
            {pwError}
          </div>
        )}
        {pwMsg && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {pwMsg}
          </div>
        )}

        <div>
          <label
            htmlFor="settings-new-password"
            className="mb-1 block text-sm font-semibold text-slate-700"
          >
            New Password
          </label>
          <ul
            id="settings-pw-rules"
            className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"
          >
            <li>• 8+ characters</li>
            <li>• Uppercase &amp; lowercase</li>
            <li>• One number &amp; one symbol</li>
          </ul>
          <div className="relative">
            <input
              id="settings-new-password"
              name="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}"
              aria-describedby="settings-pw-rules"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="uw-input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-2.5 top-2.5 rounded-md p-1 text-slate-500 hover:bg-slate-100"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F3A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#102A4C] disabled:opacity-60"
        >
          {savingPassword && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Update Password
        </button>
      </form>
    </div>
  );
}
