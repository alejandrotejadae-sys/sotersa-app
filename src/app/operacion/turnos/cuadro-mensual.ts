import type { Hoja } from "@/lib/xlsx";
import type { TipoTurno } from "@/lib/tipos";
import type { PuestoProgramable } from "./permisos";

export type AgenteImportable = {
  id: string;
  nombre: string;
  cedula?: string | null;
};
export type TurnoImportado = {
  fila: number;
  puesto_id: string;
  guardia_id: string;
  tipo: TipoTurno;
  inicio_programado: string;
  fin_programado: string;
  estado: "programado";
  etiqueta: string;
};

export type ResultadoCuadro = {
  hoja: string;
  turnos: TurnoImportado[];
  errores: string[];
  bloques: number;
  libres: number;
  ajustes: number;
};

const ZONA = "-05:00";
const MS_DIA = 24 * 60 * 60 * 1000;

const MESES: [RegExp, number][] = [
  [/\b(?:ENE|ENERO)\b/, 1],
  [/\b(?:FEB|FEBRERO)\b/, 2],
  [/\b(?:MAR|MARZO)\b/, 3],
  [/\b(?:ABR|ABRIL)\b/, 4],
  [/\b(?:MAY|MAYO)\b/, 5],
  [/\b(?:JUN|JUNIO)\b/, 6],
  [/\b(?:JUL|JULIO)\b/, 7],
  [/\b(?:AGO|AGOSTO)\b/, 8],
  [/\b(?:SEP|SEPT|SEPTIEMBRE)\b/, 9],
  [/\b(?:OCT|OCTUBRE)\b/, 10],
  [/\b(?:NOV|NOVIEMBRE)\b/, 11],
  [/\b(?:DIC|DICIEMBRE)\b/, 12],
];

const ALIAS_PUESTOS: Record<string, { cliente: string; ordinal: number }> = {
  "20": { cliente: "boreal", ordinal: 1 },
  "60": { cliente: "marfil", ordinal: 1 },
  "70": { cliente: "colina", ordinal: 1 },
  "80": { cliente: "napoles", ordinal: 1 },
  "110": { cliente: "hospital americano", ordinal: 1 },
  "120": { cliente: "unib e", ordinal: 1 },
  "130": { cliente: "unib e", ordinal: 2 },
  "140": { cliente: "unib e", ordinal: 3 },
  "45-55": { cliente: "la selva", ordinal: 1 },
};

const CORRECCIONES_CONOCIDAS: Record<string, string> = {
  "2026-09|70|28|jordy ganchozo": "M",
  "2026-09|70|28|roberto vasconez": "L",
  "2026-09|70|28|david campana": "N",
};

export function esCuadroMensual(filas: string[][]): boolean {
  return filas.some(
    (f, i) =>
      /^soter\b/.test(normalizar(f[0] ?? "")) &&
      normalizar(filas[i + 1]?.[0] ?? "").includes("nombre trabajador"),
  );
}

export function elegirHojaMensual(hojas: Hoja[]): Hoja | null {
  const candidatas = hojas
    .map((hoja) => ({ hoja, periodo: periodoDeHoja(hoja.nombre) }))
    .filter(
      (x): x is { hoja: Hoja; periodo: { anio: number; mes: number } } =>
        Boolean(x.periodo) && esCuadroMensual(x.hoja.filas),
    );
  candidatas.sort(
    (a, b) =>
      a.periodo.anio * 12 +
      a.periodo.mes -
      (b.periodo.anio * 12 + b.periodo.mes),
  );
  return candidatas.at(-1)?.hoja ?? null;
}

export function convertirCuadroMensual(
  hoja: Hoja,
  agentes: AgenteImportable[],
  puestos: PuestoProgramable[],
): ResultadoCuadro {
  const periodo = periodoDeHoja(hoja.nombre);
  if (!periodo)
    return {
      hoja: hoja.nombre,
      turnos: [],
      errores: [`La hoja «${hoja.nombre}» no indica mes y año.`],
      bloques: 0,
      libres: 0,
      ajustes: 0,
    };

  const errores: string[] = [];
  const turnos: TurnoImportado[] = [];
  let bloques = 0;
  let libres = 0;
  let ajustes = 0;

  for (let r = 0; r < hoja.filas.length; r++) {
    const rotulo = String(hoja.filas[r]?.[0] ?? "").trim();
    if (!/^soter\b/i.test(rotulo)) continue;
    const cabecera = hoja.filas[r + 1] ?? [];
    if (!normalizar(cabecera[0] ?? "").includes("nombre trabajador")) continue;
    bloques++;

    const puesto = resolverPuesto(rotulo, puestos);
    if (!puesto.ok) errores.push(`Bloque «${rotulo}»: ${puesto.error}`);
    const columnasDia = cabecera
      .slice(1)
      .map((v, i) => ({ columna: i + 1, dia: Number(String(v ?? "").trim()) }))
      .filter((x) => Number.isInteger(x.dia) && x.dia >= 1 && x.dia <= 31);
    if (columnasDia.length === 0)
      errores.push(`Bloque «${rotulo}»: no encuentro los días del mes.`);

    for (let rr = r + 2; rr < hoja.filas.length; rr++) {
      const fila = hoja.filas[rr] ?? [];
      const nombre = String(fila[0] ?? "").trim();
      if (!nombre || /^soter\b/i.test(nombre)) break;
      const agente = resolverAgente(nombre, agentes);
      if (!agente.ok) {
        errores.push(`Fila ${rr + 1}: ${agente.error}`);
        continue;
      }
      if (!puesto.ok) continue;

      for (const { columna, dia } of columnasDia) {
        const codigoOriginal = normalizarCodigo(fila[columna]);
        const codigo = corregirCodigo(
          periodo,
          rotulo,
          dia,
          nombre,
          codigoOriginal,
        );
        if (codigo !== codigoOriginal) ajustes++;
        if (!codigo) continue;
        if (codigo === "L") {
          libres++;
          continue;
        }
        if (!(["M", "N", "H"] as string[]).includes(codigo)) {
          errores.push(
            `Fila ${rr + 1}, día ${dia}: código «${String(fila[columna] ?? "").trim()}» no reconocido. Usa M, N, H o L.`,
          );
          continue;
        }
        const fecha = fechaValida(periodo.anio, periodo.mes, dia);
        if (!fecha) {
          errores.push(
            `Fila ${rr + 1}: el día ${dia} no existe en ${hoja.nombre}.`,
          );
          continue;
        }
        const nocturno = codigo === "N" || codigo === "H";
        const hInicio = nocturno ? "19:00" : "07:00";
        const hFin = nocturno ? "07:00" : "19:00";
        const inicio = new Date(`${fecha}T${hInicio}:00${ZONA}`);
        let fin = new Date(`${fecha}T${hFin}:00${ZONA}`);
        if (fin <= inicio) fin = new Date(fin.getTime() + MS_DIA);
        turnos.push({
          fila: rr + 1,
          puesto_id: puesto.valor.id,
          guardia_id: agente.valor.id,
          tipo: nocturno ? "fijo_noche" : "fijo_dia",
          inicio_programado: inicio.toISOString(),
          fin_programado: fin.toISOString(),
          estado: "programado",
          etiqueta: `${agente.valor.nombre} · ${puesto.valor.empresa} ${puesto.valor.codigo} · ${fecha} ${codigo}`,
        });
      }
    }
  }

  if (bloques === 0)
    errores.push(
      "No encontré bloques mensuales que empiecen con SOTER y NOMBRE TRABAJADOR.",
    );
  return {
    hoja: hoja.nombre,
    turnos,
    errores: [...new Set(errores)],
    bloques,
    libres,
    ajustes,
  };
}

function corregirCodigo(
  periodo: { anio: number; mes: number },
  rotulo: string,
  dia: number,
  nombre: string,
  codigo: string,
): string {
  const numero =
    /\b(45\s*-\s*55|\d{2,3})\b/
      .exec(normalizar(rotulo))?.[1]
      ?.replace(/\s/g, "") ?? "";
  const clave = `${periodo.anio}-${String(periodo.mes).padStart(2, "0")}|${numero}|${dia}|${normalizar(nombre)}`;
  return CORRECCIONES_CONOCIDAS[clave] ?? codigo;
}

function periodoDeHoja(nombre: string): { anio: number; mes: number } | null {
  const n = normalizar(nombre)
    .toUpperCase()
    .replace(/[._-]+/g, " ")
    .replace(/([A-Z])([0-9])/g, "$1 $2");
  const anio = Number(/\b(20\d{2})\b/.exec(n)?.[1]);
  const mes = MESES.find(([patron]) => patron.test(n))?.[1];
  return anio && mes ? { anio, mes } : null;
}

function resolverPuesto(
  rotulo: string,
  puestos: PuestoProgramable[],
): { ok: true; valor: PuestoProgramable } | { ok: false; error: string } {
  const n = normalizar(rotulo);
  const numero =
    /\b(45\s*-\s*55|\d{2,3})\b/.exec(n)?.[1]?.replace(/\s/g, "") ?? "";
  const alias = ALIAS_PUESTOS[numero];
  if (alias) {
    const candidatos = puestos
      .filter((p) => parecido(normalizar(p.empresa), alias.cliente))
      .sort((a, b) =>
        a.codigo.localeCompare(b.codigo, "es", { numeric: true }),
      );
    const elegido = candidatos[alias.ordinal - 1];
    if (elegido) return { ok: true, valor: elegido };
    return {
      ok: false,
      error: `no encuentro el puesto ${alias.ordinal} de ${alias.cliente} entre los puestos disponibles.`,
    };
  }

  const etiqueta = n
    .replace(/^soter\s*/, "")
    .replace(/\b\d+(?:\s*-\s*\d+)?\b/g, "")
    .trim();
  const candidatos = puestos.filter((p) =>
    parecido(normalizar(`${p.empresa} ${p.nombre} ${p.codigo}`), etiqueta),
  );
  if (candidatos.length === 1) return { ok: true, valor: candidatos[0] };
  if (candidatos.length === 0)
    return { ok: false, error: "no encuentro un puesto activo que coincida." };
  return {
    ok: false,
    error: `coincide con ${candidatos.length} puestos; necesito distinguir el código.`,
  };
}

function resolverAgente(
  nombre: string,
  agentes: AgenteImportable[],
): { ok: true; valor: AgenteImportable } | { ok: false; error: string } {
  const buscado = normalizar(nombre);
  const exactos = agentes.filter((g) => normalizar(g.nombre) === buscado);
  if (exactos.length === 1) return { ok: true, valor: exactos[0] };
  const tokens = buscado.split(" ").filter((t) => t.length > 1);
  const candidatos = agentes.filter((g) => {
    const disponibles = normalizar(g.nombre)
      .split(" ")
      .filter((t) => t.length > 1);
    return tokens.every((t) =>
      disponibles.some(
        (d) => d === t || (d[0] === t[0] && distancia(d, t) <= 2),
      ),
    );
  });
  if (candidatos.length === 1) return { ok: true, valor: candidatos[0] };
  if (candidatos.length === 0)
    return { ok: false, error: `no encuentro al agente activo «${nombre}».` };
  return {
    ok: false,
    error: `«${nombre}» coincide con ${candidatos.length} agentes; usa un nombre más completo.`,
  };
}

function parecido(texto: string, buscado: string): boolean {
  const tokens = normalizar(buscado)
    .split(" ")
    .filter((t) => t.length > 2);
  return tokens.length > 0 && tokens.every((t) => texto.includes(t));
}

function fechaValida(anio: number, mes: number, dia: number): string | null {
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    d.getUTCFullYear() !== anio ||
    d.getUTCMonth() !== mes - 1 ||
    d.getUTCDate() !== dia
  )
    return null;
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function normalizarCodigo(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toUpperCase();
}
function normalizar(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .replace(/\s+/g, " ");
}

function distancia(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = arriba;
    }
  }
  return prev[b.length];
}
