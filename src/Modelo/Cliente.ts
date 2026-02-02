import type { Colecta } from "./Colecta";

export interface Cliente {
  id: string;
  razonSocial: string;
  cuit?: string;
  colectas?: Colecta[];
}
