"use client";

import { useEffect } from "react";

export function RegistroPwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const registrar = () => { void navigator.serviceWorker.register("/sw.js", { scope: "/" }); };
    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
    return () => window.removeEventListener("load", registrar);
  }, []);
  return null;
}
