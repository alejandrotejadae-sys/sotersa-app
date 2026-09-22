import { redirect } from "next/navigation";

export const metadata = { title: "Abrir turno — SOTERSA" };
export const dynamic = "force-dynamic";

export default function PaginaApertura() {
  redirect("/guardia");
}
