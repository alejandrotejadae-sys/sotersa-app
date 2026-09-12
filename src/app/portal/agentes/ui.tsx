export function Estado({ estado }: { estado: "en_puesto" | "programado" | "fuera" }) {
  const [texto, clase] = estado === "en_puesto" ? ["En puesto", "bg-normal/15 text-green-300"] : estado === "programado" ? ["Programado", "bg-amber-500/12 text-amber-300"] : ["Fuera de turno", "bg-slate-500/10 text-gris-400"];
  return <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${clase}`}>{texto}</span>;
}
export function Resumen({ titulo, valor, normal = false }: { titulo: string; valor: number; normal?: boolean }) {
  return <article className="panel-operativo p-3 text-center"><p className={`text-2xl font-bold ${normal ? "text-green-300" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-gris-400">{titulo}</p></article>;
}
export function iniciales(nombre: string) { return nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase(); }
