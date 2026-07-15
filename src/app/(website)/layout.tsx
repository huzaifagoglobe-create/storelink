import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { RevealObserver } from "@/components/website/reveal";

/**
 * THE WEBSITE LAYER. Every public marketing page lives in this folder and
 * automatically gets the header, mega footer, and scroll animations.
 * The words for these pages live in src/content/site-content.ts.
 */
export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <RevealObserver />
      {children}
      <SiteFooter />
    </>
  );
}
