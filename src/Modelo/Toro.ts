import type { Colecta } from "./colecta";
import type { RazaEnum } from "./RazaEnum";


export interface Toro {
  id: string;
  nombre: string;
  raza: RazaEnum;
  colectas?: Colecta[];
}
