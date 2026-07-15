"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

// Reads the chosen language from the `lang` cookie on the client.
// Used by client components (cart, checkout) that can't call server cookies().
export function useClientLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)lang=(en|ur)/);
    if (m?.[1] === "ur") setLang("ur");
  }, []);
  return lang;
}
