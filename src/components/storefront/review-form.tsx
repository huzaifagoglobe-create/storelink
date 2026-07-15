"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({ shopSlug, productId }: { shopSlug: string; productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function addPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (photos.length >= 3) {
      setError("You can add up to 3 photos.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("shopSlug", shopSlug);
      fd.append("file", file);
      const res = await fetch("/api/reviews/photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not upload the image.");
      setPhotos((p) => [...p, data.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the image.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (rating < 1) {
      setError("Please tap a star to rate.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopSlug, productId, rating, author, comment, photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save your review.");
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className="rounded-xl bg-[#EAF3EE] p-3 text-sm text-ink">Thanks for your review!</p>;
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary";
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-medium text-ink">Write a review</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star`}
            className="text-2xl leading-none"
            style={{ color: n <= rating ? "#E8A317" : "#D6DEDA" }}
          >
            ★
          </button>
        ))}
      </div>
      <input
        className={inputClass}
        placeholder="Your name (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <textarea
        className={inputClass}
        rows={3}
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {/* Photo upload — up to 3 */}
      <div>
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Review photo" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                aria-label="Remove photo"
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <label
              className={
                "flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-muted transition hover:border-primary " +
                (uploading ? "opacity-60" : "")
              }
            >
              <input type="file" accept="image/*" onChange={addPhoto} disabled={uploading} className="hidden" />
              {uploading ? "…" : "+ Photo"}
            </label>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted">Add up to 3 photos (optional) — real photos help other buyers.</p>
      </div>

      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}
