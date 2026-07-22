"use client";

import Image from "next/image";
import { useState } from "react";

import { BRANDING } from "@/config/branding";

export function NavLogo() {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <Image
        src={BRANDING.logoNavFallback}
        alt={BRANDING.companyName}
        width={96}
        height={48}
        priority
        className="h-12 w-auto"
      />
    );
  }

  return (
    <Image
      src={BRANDING.logoNav}
      alt={BRANDING.companyName}
      width={192}
      height={96}
      priority
      className="h-12 w-auto"
      onError={() => setUseFallback(true)}
    />
  );
}
