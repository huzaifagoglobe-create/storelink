"use client";

import { useRef, useState } from "react";

const MAX_IMAGES = 5;

export function ImageUploader({
  name = "imageUrls",
  initial = [],
  endpoint = "/api/uploads",
  max = MAX_IMAGES,
}: {
  name?: string;
  initial?: string[];
  endpoint?: string;
  max?: number;
}) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of files) {
        if (urls.length >= max) {
          setError(`You can add up to ${MAX_IMAGES} photos.`);
          break;
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(endpoint, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Upload failed.");
          continue;
        }
        setUrls((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, data.url]));
      }
    } finally {
      setUploading(false);
    }
  }

  const remove = (url: string) => setUrls((prev) => prev.filter((u) => u !== url));
  const setCover = (url: string) => setUrls((prev) => [url, ...prev.filter((u) => u !== url)]);

  return (
    <div>
      {/* Hidden inputs carry the URLs into the product form submit. */}
      {urls.map((u) => (
        <input key={u} type="hidden" name={name} value={u} />
      ))}

      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div
            key={u}
            className="relative h-20 w-20 overflow-hidden rounded-lg border border-line bg-background"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            {i === 0 ? (
              <span className="absolute bottom-0 left-0 right-0 bg-ink/70 py-0.5 text-center text-[10px] text-white">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setCover(u)}
                className="absolute bottom-0 left-0 right-0 bg-ink/50 py-0.5 text-center text-[10px] text-white transition hover:bg-primary"
              >
                Set cover
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(u)}
              aria-label="Remove photo"
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}

        {urls.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "+ Photo"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        onChange={onFiles}
        className="hidden"
      />

      {error && <p className="mt-1 text-xs text-[#b3261e]">{error}</p>}
      <p className="mt-1 text-xs text-muted">
        JPG, PNG, WEBP or GIF · up to 4 MB each · {MAX_IMAGES} max. The cover shows first — tap “Set cover” to change it.
      </p>
    </div>
  );
}
