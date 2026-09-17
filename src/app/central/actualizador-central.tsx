"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ActualizadorCentral({ intervaloMs = 8000 }: { intervaloMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs, router]);
  return null;
}
