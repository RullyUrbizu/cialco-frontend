import type { Canastillo } from "./Canastillo";
import type { Cliente } from "./Cliente";
import type { RazaEnum } from "./RazaEnum";
import type { Termo } from "./Termo";
import type { Toro } from "./Toro";

export interface ColectaContenedor {
  id: string;
  colectaId: string;
  termoId: string;
  canastilloId: string;
  cantidad: number;
  stockActual: number;
  termo?: Termo;
  canastillo?: Canastillo;
}

export interface Colecta {
  id: string;
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
  color?: string;
  contenedores?: ColectaContenedor[];
  inventario?: {
    id: string;
    colectaId: string;
    cantidadInicial: number;
    ingresosTotal: number;
    salidasTotal: number;
    stockActual: number;
  };
}
