/** Tipos del plan de estudios de la Escuela de Formacion. */

export type Recurso = {
  tipo: "video" | "documento" | "web";
  titulo: string;
  url: string;
  fuente: string;
  nota?: string;
  /** Solo para videos de YouTube: permite incrustarlos. */
  youtubeId?: string;
};

export type Seccion = {
  titulo?: string;
  parrafos?: string[];
  lista?: string[];
  /** Regla o idea que conviene que quede grabada. */
  destacado?: string;
  /** Como se aplica en SOTERSA: enlaza con la app o con los reglamentos. */
  enSotersa?: string;
};

export type Leccion = {
  id: string;
  titulo: string;
  minutos: number;
  objetivo: string;
  secciones: Seccion[];
  recursos: Recurso[];
};

export type Pregunta = {
  id: string;
  texto: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
};

export type Modulo = {
  id: string;
  codigo: string;
  titulo: string;
  resumen: string;
  paraQuien: string;
  color: "azul" | "verde" | "ambar";
  /**
   * A quien se le exige. "todos": cuenta para la formacion basica de cada
   * agente. "cliente": solo para quien esta asignado a ese tipo de puesto.
   * "supervisores": solo supervisores. Sin valor = "todos".
   */
  alcance?: "todos" | "cliente" | "supervisores";
  lecciones: Leccion[];
  evaluacion: { minimoAprobar: number; preguntas: Pregunta[] };
};

export const yt = (id: string, titulo: string, fuente: string, nota?: string): Recurso => ({ tipo: "video", titulo, url: `https://www.youtube.com/watch?v=${id}`, fuente, nota, youtubeId: id });
