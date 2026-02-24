import type { Colecta } from "./Colecta";
import type { RazaEnum } from "./RazaEnum";


export interface Toro {
  id: string;
  nombre: string;
  raza: RazaEnum;
  colectas?: Colecta[];
}
