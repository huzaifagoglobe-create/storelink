// Maps a courier name + tracking number to that courier's public tracking page.
// Used to give buyers a "Track your parcel" link on the order page. If we don't
// have a URL pattern, the number is still shown (buyer can search it manually).

const TRACK_URLS: Record<string, (n: string) => string> = {
  tcs: (n) => `https://www.tcsexpress.com/track/${encodeURIComponent(n)}`,
  leopards: (n) => `https://www.leopardscourier.com/tracking?tracking_number=${encodeURIComponent(n)}`,
  "m&p": () => `https://www.mulphilog.com/`,
  postex: (n) => `https://postex.pk/tracking?trackingNumber=${encodeURIComponent(n)}`,
  trax: (n) => `https://sonic.pk/tracking?id=${encodeURIComponent(n)}`,
  swyft: () => `https://swyftlogistics.com/`,
  blueex: (n) => `https://www.blue-ex.com/track/${encodeURIComponent(n)}`,
  callcourier: (n) => `https://cod.callcourier.com.pk/track/${encodeURIComponent(n)}`,
  daewoo: () => `https://daewoo.com.pk/`,
};

/** Returns a public tracking URL for the courier, or null if unknown. */
export function trackingUrl(courier: string | null, trackingNumber: string | null): string | null {
  if (!courier || !trackingNumber) return null;
  const fn = TRACK_URLS[courier.trim().toLowerCase()];
  return fn ? fn(trackingNumber.trim()) : null;
}
