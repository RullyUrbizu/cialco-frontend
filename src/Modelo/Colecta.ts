import type { Canastillo } from "./Canastillo";
import type { Cliente } from "./Cliente";
import type { RazaEnum } from "./RazaEnum";
import type { Termo } from "./Termo";
import type { Toro } from "./Toro";

export interface Colecta {
  id: string;
  termo: Termo;
  canastillo: Canastillo;
  toro: Toro;
  raza: RazaEnum;
  cliente: Cliente;
  cuit: string;
  fecha: Date;
  vigorMot: string;
  cantidad: number;
  ingreso: number;
  sale: number;
  stock: number;
  inventario?: {
    id: string;
    colectaId: string;
    cantidadInicial: number;
    ingresosTotal: number;
    salidasTotal: number;
    stockActual: number;
  };
}
