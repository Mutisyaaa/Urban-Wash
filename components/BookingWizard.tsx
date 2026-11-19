"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateOrderPricing,
  DUVET_PRICES,
  formatKsh,
  PICKUP_TIME_SLOTS,
  type DuvetSize,
} from "@/lib/pricing";
import type { ProfileRow, ServiceRow } from "@/lib/types/database";

const STEPS = [
  { id: 1, label: "Service" },
  { id: 2, label: "Details" },
  { id: 3, label: "Payment" },
  { id: 4, label: "Confirmation" },
];

interface CreatedOrderResult {
  id: number;
  order_code: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_status: string;
}

export function BookingWizard({
  services,
  initialServiceSlug,
  initialProfile,
}: {
  services: ServiceRow[];
  initialServiceSlug?: string;
  initialProfile: ProfileRow | null;
}) {
  const defaultService =
    services.find((s) => s.slug === initialServiceSlug) ??
    services[0] ??
    null;

  const todayIso = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [step, setStep] = useState<number>(1);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    defaultService?.slug ?? "laundry-by-weight"
  );
  const [quantity, setQuantity] = useState<number>(
    defaultService?.slug === "laundry-by-weight" ? 5 : 1
  );
  const [duvetSize, setDuvetSize] = useState<DuvetSize>("4x6");
  const [addStainRemoval, setAddStainRemoval] = useState<boolean>(false);
  const [pickupDate, setPickupDate] = useState<string>(todayIso);
  const [pickupAddress, setPickupAddress] = useState<string>(
    initialProfile?.default_address ?? ""
  );
  const [timeSlot, setTimeSlot] = useState<string>(PICKUP_TIME_SLOTS[1]);
  const [customerName, setCustomerName] = useState<string>(
    initialProfile?.full_name ?? ""
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialProfile?.phone ?? ""
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "mpesa" | "cash_on_delivery"
  >("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState<string>(
    initialProfile?.phone ?? ""
  );

  // Simulated STK Push state
  const [stkModalOpen, setStkModalOpen] = useState<boolean>(false);
  const [stkStep, setStkStep] = useState<"prompt" | "processing" | "done">(
    "prompt"
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderResult | null>(
    null
  );
  const [copied, setCopied] = useState<boolean>(false);

  const selectedService =
    services.find((s) => s.slug === selectedSlug) ?? services[0];

  const stainService = services.find((s) => s.slug === "stain-removal");
  const stainPrice = stainService ? Number(stainService.unit_price) : 200;

  const pricing = useMemo(() => {
    if (!selectedService) {
      return {
        baseUnitPrice: 0,
        effectiveUnitPrice: 0,
        regularLineTotal: 0,
        actualLineTotal: 0,
        addonTotal: 0,
        subtotal: 0,
        discountAmount: 0,
        total: 0,
        discountApplied: false,
        variantLabel: null,
      };
    }
    return calculateOrderPricing({
      service: selectedService,
      quantity,
      duvetSize,
      addStainRemoval,
      stainRemovalPrice: stainPrice,
    });
  }, [selectedService, quantity, duvetSize, addStainRemoval, stainPrice]);

  const handleServiceChange = (slug: string) => {
    setSelectedSlug(slug);
    if (slug === "laundry-by-weight" && quantity < 3) {
      setQuantity(5);
    } else if (slug !== "laundry-by-weight" && quantity > 5) {
      setQuantity(1);
    }
    if (slug === "stain-removal") {
      setAddStainRemoval(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (quantity <= 0) {
      setErrorMsg("Please enter a weight or quantity greater than 0.");
      return;
    }
    if (!pickupDate) {
      setErrorMsg("Please choose a pickup date.");
      return;
    }
    if (!pickupAddress.trim()) {
      setErrorMsg("Please enter your pickup address or neighborhood.");
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!customerName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg("Please enter a Kenyan phone number for rider coordination.");
      return;
    }
    if (!mpesaPhone) {
      setMpesaPhone(customerPhone.trim());
    }
    setStep(3);
  };

  const submitOrderToSupabase = async (mpesaRef: string | null) => {
    if (!selectedService) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_order", {
        p_service_slug: selectedService.slug,
        p_quantity: quantity,
        p_duvet_size:
          selectedService.slug === "duvet-wash-dry" ? duvetSize : undefined,
        p_add_stain_removal: addStainRemoval,
        p_pickup_date: pickupDate,
        p_pickup_time_slot: timeSlot,
        p_pickup_address: pickupAddress.trim(),
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_special_instructions: specialInstructions.trim() || undefined,
        p_payment_method: paymentMethod,
        p_mpesa_phone:
          paymentMethod === "mpesa"
            ? (mpesaPhone || customerPhone).trim()
            : undefined,
        p_mpesa_reference: mpesaRef ?? undefined,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as unknown as CreatedOrderResult;
      setCreatedOrder(result);
      setStkModalOpen(false);
      setStep(4);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not complete booking. Please try again."
      );
      setStkModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (paymentMethod === "mpesa") {
      if (!(mpesaPhone || customerPhone).trim()) {
        setErrorMsg("Please enter the M-Pesa phone number to prompt.");
        return;
      }
      setStkStep("prompt");
      setStkModalOpen(true);
      return;
    }

    await submitOrderToSupabase(null);
  };

  const confirmSimulatedStkPush = async () => {
    setStkStep("processing");
    const randomRef = `UBW${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
    await new Promise((r) => setTimeout(r, 900));
    setStkStep("done");
    await submitOrderToSupabase(randomRef);
  };

  const handleCopyCode = async () => {
    if (!createdOrder?.order_code) return;
    try {
      await navigator.clipboard.writeText(createdOrder.order_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted contexts
    }
  };

  if (!selectedService) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">
          No services are currently available. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 4-Step Progress Bar matching blueprint */}
      <nav aria-label="Booking progress" className="mx-auto max-w-2xl">
        <ol className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const isComplete = step > s.id;
            const isCurrent = step === s.id;
            return (
              <li
                key={s.id}
                className="relative flex flex-1 flex-col items-center text-center"
              >
                {idx > 0 && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-4 -left-1/2 h-0.5 w-full ${
                      step >= s.id ? "bg-[#1B75FF]" : "bg-slate-200"
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                    isComplete
                      ? "bg-[#1B75FF] text-white"
                      : isCurrent
                      ? "bg-[#1B75FF] text-white ring-4 ring-blue-100"
                      : "border border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    s.id
                  )}
                </span>
                <span
                  className={`mt-2 text-xs font-semibold ${
                    isCurrent || isComplete ? "text-[#0B1F3A]" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {errorMsg && (
        <div
          role="alert"
          className="mx-auto max-w-5xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
        >
          {errorMsg}
        </div>
      )}

      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-12 lg:items-start">
        {/* Main Step Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
                  Book a Service
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Step 1 of 4 — Choose your laundry service, load size, and
                  pickup window.
                </p>
              </div>

              <div>
                <label
                  htmlFor="booking-service"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Select Service
                </label>
                <select
                  id="booking-service"
                  value={selectedSlug}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="uw-input font-medium"
                >
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} ({s.price_label})
                    </option>
                  ))}
                </select>
              </div>

              {selectedService.slug === "duvet-wash-dry" && (
                <div>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Duvet Size
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(["3x6", "4x6", "5x6"] as DuvetSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setDuvetSize(size)}
                        className={`rounded-xl border px-3 py-2.5 text-center text-sm font-bold transition ${
                          duvetSize === size
                            ? "border-[#1B75FF] bg-blue-50 text-[#1B75FF]"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div>{size}</div>
                        <div className="text-xs font-medium text-slate-500">
                          {formatKsh(DUVET_PRICES[size])}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="booking-quantity"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  {selectedService.pricing_unit === "kg"
                    ? "Estimated Weight (kg)"
                    : `Quantity (${selectedService.pricing_unit}s)`}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <input
                    id="booking-quantity"
                    type="number"
                    min={1}
                    max={200}
                    step={selectedService.pricing_unit === "kg" ? "0.5" : "1"}
                    required
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(0.5, Number(e.target.value) || 0))
                    }
                    className="uw-input text-center font-bold"
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {selectedService.slug === "laundry-by-weight" && (
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    {quantity >= 10 ? (
                      <span className="text-emerald-700 font-bold">
                        ✓ 10kg+ bulk discount active: KSh 180/kg applied!
                      </span>
                    ) : (
                      <span>
                        Tip: Add {Math.max(0, 10 - quantity)}kg more to unlock
                        the KSh 180/kg bulk discount.
                      </span>
                    )}
                  </p>
                )}
              </div>

              {selectedService.slug !== "stain-removal" && (
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 hover:border-blue-200">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={addStainRemoval}
                      onChange={(e) => setAddStainRemoval(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#1B75FF]"
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      Add Targeted Stain Removal
                    </span>
                  </span>
                  <span className="text-xs font-bold text-[#1B75FF]">
                    +{formatKsh(stainPrice)}
                  </span>
                </label>
              )}

              <div>
                <label
                  htmlFor="booking-date"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Pickup Date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  min={todayIso}
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="uw-input"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-address"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Pickup Address
                </label>
                <div className="relative">
                  <input
                    id="booking-address"
                    name="street-address"
                    type="text"
                    required
                    autoComplete="street-address"
                    placeholder="e.g. Apt 4B, Ring Road, Westlands, Nairobi"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="uw-input pl-10"
                  />
                  <MapPin
                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#1B75FF] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#145FD6]"
              >
                Continue to Next Step
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
                  Pickup Details
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Step 2 of 4 — Let our rider know when and who to call on
                  arrival.
                </p>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Preferred Time Slot
                </span>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {PICKUP_TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition ${
                        timeSlot === slot
                          ? "border-[#1B75FF] bg-blue-50 text-[#1B75FF]"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="customer-name"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="customer-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Charles Kamau"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="uw-input"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-phone"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Phone Number (for Rider SMS/Call)
                </label>
                <input
                  id="customer-phone"
                  name="tel"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="0712 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="uw-input"
                />
              </div>

              <div>
                <label
                  htmlFor="special-instructions"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Special Care Instructions{" "}
                  <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  id="special-instructions"
                  rows={3}
                  placeholder="e.g. Gate code 4421, fragrance-free detergent, hang white shirts..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="uw-input"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#1B75FF] px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#145FD6]"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
                  Payment Method
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Step 3 of 4 — Choose simulated M-Pesa STK Push or pay on
                  delivery.
                </p>
              </div>

              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                    paymentMethod === "mpesa"
                      ? "border-[#1B75FF] bg-blue-50/50 ring-1 ring-[#1B75FF]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="mpesa"
                    checked={paymentMethod === "mpesa"}
                    onChange={() => setPaymentMethod("mpesa")}
                    className="mt-1 h-4 w-4 text-[#1B75FF]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 font-bold text-[#0B1F3A]">
                        <Smartphone
                          className="h-4 w-4 text-emerald-600"
                          aria-hidden="true"
                        />
                        M-Pesa Express (STK Push Demo)
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        Instant
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Simulates an M-Pesa STK prompt to your Safaricom number and
                      records a receipt reference. Ready for live Daraja API
                      wiring.
                    </p>
                  </div>
                </label>

                {paymentMethod === "mpesa" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label
                      htmlFor="mpesa-phone"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      M-Pesa Phone Number
                    </label>
                    <input
                      id="mpesa-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="0712 345 678"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      className="uw-input"
                    />
                  </div>
                )}

                <label
                  className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                    paymentMethod === "cash_on_delivery"
                      ? "border-[#1B75FF] bg-blue-50/50 ring-1 ring-[#1B75FF]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash_on_delivery"
                    checked={paymentMethod === "cash_on_delivery"}
                    onChange={() => setPaymentMethod("cash_on_delivery")}
                    className="mt-1 h-4 w-4 text-[#1B75FF]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 font-bold text-[#0B1F3A]">
                        <CreditCard
                          className="h-4 w-4 text-[#1B75FF]"
                          aria-hidden="true"
                        />
                        Cash / M-Pesa on Delivery
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        Pay Later
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Pay our rider by cash or Lipa na M-Pesa Till when your
                      fresh laundry arrives back at your door.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B75FF] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#145FD6] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Confirming Booking...
                    </>
                  ) : paymentMethod === "mpesa" ? (
                    `Pay ${formatKsh(pricing.total)} via M-Pesa`
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 4 && createdOrder && (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                  Booking Confirmed
                </span>
                <h1 className="mt-1 text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
                  Order {createdOrder.order_code} Placed!
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Your pickup is scheduled for{" "}
                  <strong>{pickupDate}</strong> ({timeSlot}) at{" "}
                  <strong>{pickupAddress}</strong>.
                </p>
              </div>

              <div className="mx-auto flex max-w-sm items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/60 px-5 py-3.5">
                <div className="text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Tracking Number
                  </div>
                  <div className="text-xl font-extrabold tracking-wide text-[#0B1F3A]">
                    {createdOrder.order_code}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1B75FF] shadow-sm ring-1 ring-blue-100 hover:bg-blue-50"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href={`/track?code=${encodeURIComponent(
                    createdOrder.order_code
                  )}`}
                  className="inline-flex items-center justify-center rounded-xl bg-[#1B75FF] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#145FD6]"
                >
                  Track Your Order
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-[#0B1F3A] hover:bg-slate-50"
                >
                  View in Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Order Summary Card matching blueprint */}
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:col-span-5">
          <h2 className="text-lg font-extrabold text-[#0B1F3A]">
            Order Summary
          </h2>

          <div className="mt-5 space-y-3.5 border-b border-slate-100 pb-5 text-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-slate-800">
                  {selectedService.name}
                </p>
                <p className="text-xs text-slate-500">
                  {pricing.variantLabel
                    ? `${pricing.variantLabel} • `
                    : ""}
                  {quantity} {selectedService.pricing_unit}
                  {quantity === 1 ? "" : "s"} ×{" "}
                  {formatKsh(pricing.effectiveUnitPrice)}
                </p>
              </div>
              <span className="font-bold text-slate-900">
                {formatKsh(pricing.regularLineTotal)}
              </span>
            </div>

            {pricing.discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  10kg+ Bulk Discount
                </span>
                <span>-{formatKsh(pricing.discountAmount)}</span>
              </div>
            )}

            {pricing.addonTotal > 0 && (
              <div className="flex items-center justify-between text-slate-700">
                <span>Stain Removal Add-on</span>
                <span className="font-semibold">
                  {formatKsh(pricing.addonTotal)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-[#1B75FF]" aria-hidden="true" />
                Pickup &amp; Delivery
              </span>
              <span className="font-bold text-emerald-700">Free (KSh 0)</span>
            </div>
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <div>
              <p className="text-sm font-bold text-[#0B1F3A]">
                {createdOrder ? "Total Amount" : "Estimated Total"}
              </p>
              <p className="text-xs text-slate-400">
                {selectedService.pricing_unit === "kg"
                  ? "Final weight confirmed on pickup scale"
                  : "All taxes & delivery included"}
              </p>
            </div>
            <span className="text-2xl font-extrabold text-[#1B75FF]">
              {formatKsh(createdOrder ? createdOrder.total_amount : pricing.total)}
            </span>
          </div>

          <div className="mt-6 rounded-2xl bg-[#F5F8FC] p-4 text-xs text-slate-600 space-y-2">
            <p className="flex items-center gap-2 font-semibold text-[#0B1F3A]">
              <ShieldCheck
                className="h-4 w-4 text-[#1B75FF]"
                aria-hidden="true"
              />
              Urban Wash Care Guarantee
            </p>
            <p>
              Need help? Call{" "}
              <a
                href="tel:+254700123456"
                className="inline-flex items-center gap-1 font-bold text-[#1B75FF]"
              >
                <Phone className="h-3 w-3" aria-hidden="true" />
                0700 123 456
              </a>
            </p>
          </div>
        </aside>
      </div>

      {/* Simulated M-Pesa STK Push Modal */}
      {stkModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mpesa-stk-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Smartphone className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h3
                  id="mpesa-stk-title"
                  className="text-lg font-extrabold text-[#0B1F3A]"
                >
                  Simulated M-Pesa STK Push
                </h3>
                <p className="text-xs text-slate-500">
                  Demo payment prompt • No real funds charged
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-slate-800 space-y-1.5">
              <p>
                Prompt sent to:{" "}
                <strong className="text-[#0B1F3A]">
                  {mpesaPhone || customerPhone}
                </strong>
              </p>
              <p>
                Paybill / Business: <strong>Urban Wash Kenya</strong>
              </p>
              <p>
                Amount:{" "}
                <strong className="text-emerald-700">
                  {formatKsh(pricing.total)}
                </strong>
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={stkStep !== "prompt"}
                onClick={() => setStkModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={stkStep !== "prompt"}
                onClick={confirmSimulatedStkPush}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70"
              >
                {stkStep === "processing" || stkStep === "done" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Verifying M-Pesa PIN...
                  </>
                ) : (
                  "Simulate PIN Entered"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
