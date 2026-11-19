"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";

type AuthMode = "login" | "signup" | "forgot";

export function AuthPanel({
  initialMode = "login",
  nextPath = "/dashboard",
  callbackError = false,
}: {
  initialMode?: "login" | "signup";
  nextPath?: string;
  callbackError?: boolean;
}) {
  const router = useRouter();
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/dashboard";

  const formContainerRef = useRef<HTMLDivElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    callbackError
      ? "Authentication callback failed or was cancelled. Please try signing in again."
      : null
  );
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Sync ARIA invalid state + deferred validation fallback per validate-input-after-interaction
  useEffect(() => {
    const container = formContainerRef.current;
    if (!container) return;

    const supportsUserInvalid =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("selector(:user-invalid)");

    const dirtyState = new WeakMap<
      Element,
      { hasInteracted: boolean; hasBlurred: boolean }
    >();
    const flagged = new WeakSet<Element>();
    const announced = new WeakSet<Element>();
    let announceTimer: ReturnType<typeof setTimeout> | undefined;

    const linkError = (el: HTMLElement, shown: boolean) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const ids = (el.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter((id) => id && id !== errorId);
      if (shown) ids.push(errorId);
      if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
      else el.removeAttribute("aria-describedby");
    };

    const announceFieldError = (el: HTMLElement) => {
      const errorId = el.dataset.error;
      if (!errorId || !announcerRef.current) return;
      const errorEl = document.getElementById(errorId);
      if (!errorEl) return;
      const labelText =
        (el as HTMLInputElement).labels?.[0]?.textContent?.trim() ?? "";
      clearTimeout(announceTimer);
      announcerRef.current.textContent = "";
      announceTimer = setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = `${
            labelText ? `${labelText}: ` : ""
          }${errorEl.textContent?.trim() ?? ""}`;
        }
      }, 450);
    };

    const syncField = (el: EventTarget | null, announce = false) => {
      if (
        !(
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }

      const invalid = supportsUserInvalid
        ? el.matches(":user-invalid")
        : Boolean(dirtyState.get(el)?.hasBlurred) && !el.validity.valid;

      if (!supportsUserInvalid && dirtyState.get(el)?.hasBlurred) {
        el.classList.toggle("user-invalid-fallback", !el.validity.valid);
        el.classList.toggle("user-valid-fallback", el.validity.valid);
      }

      if (invalid) {
        if (announce && !announced.has(el)) {
          announceFieldError(el);
          announced.add(el);
        }
        el.setAttribute("aria-invalid", "true");
        linkError(el, true);
        flagged.add(el);
      } else if (flagged.has(el) || el.getAttribute("aria-invalid") !== "true") {
        el.setAttribute("aria-invalid", "false");
        linkError(el, false);
        flagged.delete(el);
        announced.delete(el);
      }
    };

    container
      .querySelectorAll<HTMLInputElement>("input")
      .forEach((input) => input.setAttribute("aria-invalid", "false"));

    const onBlur = (e: FocusEvent) => {
      const target = e.target;
      if (target instanceof HTMLInputElement) {
        const state = dirtyState.get(target) ?? {
          hasInteracted: false,
          hasBlurred: false,
        };
        state.hasBlurred = true;
        dirtyState.set(target, state);
      }
      syncField(target, true);
    };

    const onInput = (e: Event) => {
      const target = e.target;
      if (target instanceof HTMLInputElement) {
        const state = dirtyState.get(target) ?? {
          hasInteracted: false,
          hasBlurred: false,
        };
        state.hasInteracted = true;
        dirtyState.set(target, state);
      }
      syncField(target, false);
    };

    const onInvalid = (e: Event) => {
      const target = e.target;
      if (target instanceof HTMLInputElement) {
        dirtyState.set(target, { hasInteracted: true, hasBlurred: true });
        announced.add(target);
        if (!supportsUserInvalid) {
          target.classList.add("user-invalid-fallback");
        }
        syncField(target, false);
      }
    };

    container.addEventListener("blur", onBlur, true);
    container.addEventListener("input", onInput, true);
    container.addEventListener("invalid", onInvalid, true);

    return () => {
      clearTimeout(announceTimer);
      container.removeEventListener("blur", onBlur, true);
      container.removeEventListener("input", onInput, true);
      container.removeEventListener("invalid", onInvalid, true);
    };
  }, [mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      router.push(safeNext);
      router.refresh();
    } catch {
      setErrorMsg("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            safeNext
          )}`,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        router.push(safeNext);
        router.refresh();
      } else {
        setInfoMsg(
          "Account created! Check your email inbox to confirm your address before signing in."
        );
      }
    } catch {
      setErrorMsg("Unable to create account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
        }
      );

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setInfoMsg(
        "If an account matches that email, we've sent a password reset link."
      );
    } catch {
      setErrorMsg("Could not send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            safeNext
          )}`,
        },
      });
      if (error) {
        setErrorMsg(
          `${
            provider === "google" ? "Google" : "Facebook"
          } sign-in is not yet enabled in your Supabase Auth providers (${
            error.message
          }). You can sign in or create an account with email & password above.`
        );
      }
    } catch {
      setErrorMsg("OAuth provider could not be started.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div
        ref={announcerRef}
        aria-live="polite"
        className="visually-hidden"
      />

      <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-12">
        {/* Left Navy Photo Panel matching blueprint */}
        <div className="relative flex flex-col justify-between bg-[#0B1F3A] p-8 text-white sm:p-10 lg:col-span-5">
          <img
            src="/images/auth-bg.png"
            alt="Folded crisp white cotton towels beside a glowing washing machine"
            width={900}
            height={1200}
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#071529]/85 via-[#0B1F3A]/75 to-[#071529]/95"
          />

          <div className="relative">
            <BrandLogo variant="light" />
          </div>

          <div className="relative my-10 space-y-4">
            <h2 className="text-3xl font-extrabold leading-tight">
              Clean clothes make a better day!
            </h2>
            <p className="text-sm leading-relaxed text-slate-200">
              Manage your pickups, track orders live from wash to doorstep, and
              enjoy automatic 10kg+ savings across Kenya.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-2 border-t border-white/15 pt-6 text-center text-xs font-semibold text-sky-100">
            <div className="flex flex-col items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
              <span>Fast Service</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck
                className="h-4 w-4 text-[#38BDF8]"
                aria-hidden="true"
              />
              <span>Reliable</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Sparkles
                className="h-4 w-4 text-[#38BDF8]"
                aria-hidden="true"
              />
              <span>Affordable</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div ref={formContainerRef} className="p-6 sm:p-10 lg:col-span-7">
          {/* Login / Sign Up Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`border-b-2 pb-3.5 text-sm font-bold transition ${
                mode === "login" || mode === "forgot"
                  ? "border-[#1B75FF] text-[#1B75FF]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`border-b-2 pb-3.5 text-sm font-bold transition ${
                mode === "signup"
                  ? "border-[#1B75FF] text-[#1B75FF]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
            >
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div
              role="status"
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>{infoMsg}</span>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
                  Welcome Back!
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Sign in to your Urban Wash account.
                </p>
              </div>

              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <span
                  id="login-email-hint"
                  className="mb-1.5 block text-xs text-slate-500"
                >
                  Format: you@example.com
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  placeholder="you@example.com"
                  aria-describedby="login-email-hint"
                  data-error="login-email-error"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="uw-input"
                />
                <div id="login-email-error" className="uw-error-msg">
                  <span role="img" aria-label="Error">
                    ❌
                  </span>{" "}
                  Enter an email address in the format you@example.com.
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-xs font-semibold text-[#1B75FF] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="uw-input-wrap relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    enterKeyHint="done"
                    required
                    placeholder="Enter your password"
                    data-error="login-password-error"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="uw-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-2.5 top-2.5 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div id="login-password-error" className="uw-error-msg">
                  <span role="img" aria-label="Error">
                    ❌
                  </span>{" "}
                  Please enter your account password.
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1B75FF]"
                />
                <span>Remember me on this device</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B75FF] px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#145FD6] disabled:opacity-60"
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Sign In
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="mt-6 space-y-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
                  Create Your Account
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Book faster, save your addresses, and track every wash.
                </p>
              </div>

              <div>
                <label
                  htmlFor="signup-name"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  name="fullname"
                  type="text"
                  autoComplete="name"
                  enterKeyHint="next"
                  required
                  placeholder="Charles Kamau"
                  data-error="signup-name-error"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="uw-input"
                />
                <div id="signup-name-error" className="uw-error-msg">
                  <span role="img" aria-label="Error">
                    ❌
                  </span>{" "}
                  Please enter your full name.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="signup-email"
                    className="mb-1 block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>
                  <span
                    id="signup-email-hint"
                    className="mb-1 block text-xs text-slate-500"
                  >
                    Format: you@example.com
                  </span>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    spellCheck={false}
                    enterKeyHint="next"
                    required
                    placeholder="you@example.com"
                    aria-describedby="signup-email-hint"
                    data-error="signup-email-error"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="uw-input"
                  />
                  <div id="signup-email-error" className="uw-error-msg">
                    <span role="img" aria-label="Error">
                      ❌
                    </span>{" "}
                    Enter an email address in the format you@example.com.
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-phone"
                    className="mb-1 block text-sm font-semibold text-slate-700"
                  >
                    Phone Number
                  </label>
                  <span
                    id="signup-phone-hint"
                    className="mb-1 block text-xs text-slate-500"
                  >
                    Format: 0712 345 678
                  </span>
                  <input
                    id="signup-phone"
                    name="tel"
                    type="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    required
                    placeholder="0712 345 678"
                    aria-describedby="signup-phone-hint"
                    data-error="signup-phone-error"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="uw-input"
                  />
                  <div id="signup-phone-error" className="uw-error-msg">
                    <span role="img" aria-label="Error">
                      ❌
                    </span>{" "}
                    Please enter a valid Kenyan phone number.
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  New Password
                </label>
                <ul
                  id="signup-password-rules"
                  className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"
                >
                  <li>• 8+ characters</li>
                  <li>• Uppercase &amp; lowercase</li>
                  <li>• One number</li>
                  <li>• One symbol (!@#$)</li>
                </ul>
                <div className="uw-input-wrap relative">
                  <input
                    id="signup-password"
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    enterKeyHint="done"
                    required
                    minLength={8}
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}"
                    placeholder="Create a strong password"
                    aria-describedby="signup-password-rules"
                    data-error="signup-password-error"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="uw-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-2.5 top-2.5 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div id="signup-password-error" className="uw-error-msg">
                  <span role="img" aria-label="Error">
                    ❌
                  </span>{" "}
                  Password doesn&apos;t meet all the requirements listed above.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B75FF] px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#145FD6] disabled:opacity-60"
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Create Account
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
                  Reset Password
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your email address and we&apos;ll send you a reset link.
                </p>
              </div>

              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                  placeholder="you@example.com"
                  data-error="forgot-email-error"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="uw-input"
                />
                <div id="forgot-email-error" className="uw-error-msg">
                  <span role="img" aria-label="Error">
                    ❌
                  </span>{" "}
                  Enter an email address in the format you@example.com.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B75FF] px-6 py-3 text-sm font-bold text-white"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  Send Reset Link
                </button>
              </div>
            </form>
          )}

          {mode !== "forgot" && (
            <>
              <div className="relative my-6 flex items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-3 text-xs font-medium text-slate-400">
                  or continue with
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="font-extrabold text-[#EA4335]">G</span>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("facebook")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="font-extrabold text-[#1877F2]">f</span>
                  Facebook
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("login");
                  }}
                  className="font-bold text-[#1B75FF] hover:underline"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("signup");
                  }}
                  className="font-bold text-[#1B75FF] hover:underline"
                >
                  Sign Up
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
