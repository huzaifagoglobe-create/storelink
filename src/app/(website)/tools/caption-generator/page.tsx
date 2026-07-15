import type { Metadata } from "next";
import { CaptionTool } from "@/components/marketing/caption-tool";

export const metadata: Metadata = {
  title: "Free Instagram Caption Generator for Pakistani sellers | StoreLink",
  description: "Type your product and price — get a ready-to-post caption with hashtags for Instagram, Facebook and TikTok. Free, no signup.",
};

export default function CaptionGeneratorPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Free caption generator</h1>
      <p className="mt-2 text-sm text-muted">
        Type your product, get a ready caption + hashtags. Post more, sell more — no signup needed.
      </p>
      <div className="mt-6">
        <CaptionTool />
      </div>
    </div>
  );
}
