"use client";

import { useState } from "react";

/** "Get your shop built free" — catches interested people who won't sign up cold. */
export function LeadForm() {
  const [form, setForm] = useState({ name: "", whatsapp: "", selling: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setState("busy");
    setErr(null);
    let source: string | null = null;
    try {
      source = localStorage.getItem("wsb-src");
    } catch {
      /* ignore */
    }
    try {
      const r = await fetch("/api/seller-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Something went wrong.");
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-[#bfe0cd] bg-[#EAF3EE] p-5 text-center">
        <p className="text-sm font-semibold text-ink">Got it — we&apos;ll WhatsApp you shortly! 💚</p>
        <p className="mt-1 text-xs text-muted">A real person (the founder, actually) will message you to set up your shop.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-base font-semibold text-ink">Not sure where to start? We&apos;ll build it WITH you — free</p>
      <p className="mt-1 text-sm text-muted">Leave your WhatsApp and we&apos;ll set up your shop together in 10 minutes. No card, no commitment.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
        <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} inputMode="tel" placeholder="WhatsApp — 03XX XXXXXXX" className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
        <input value={form.selling} onChange={(e) => setForm({ ...form, selling: e.target.value })} placeholder="What do you sell?" className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
      </div>
      {err && <p className="mt-2 text-xs text-[#C0362C]">{err}</p>}
      <button onClick={submit} disabled={state === "busy"} className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:w-auto sm:px-8">
        {state === "busy" ? "Sending…" : "Get my shop built free →"}
      </button>
    </div>
  );
}
