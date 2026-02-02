import type { Colecta } from "./Colecta";


export interface Canastillo {
  id: string;
  codigo: string;
  termoId: string;
  colectas?: Colecta[];
}
