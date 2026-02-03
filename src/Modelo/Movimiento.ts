import type { Cliente } from "./Cliente";

export const TipoMovimiento = {
    INGRESO: 'ingreso',
    SALIDA: 'salida',
} as const;

export type TipoMovimiento = typeof TipoMovimiento[keyof typeof TipoMovimiento];

export interface Movimiento {
    id: string;
    inventarioId: string;
    tipo: TipoMovimiento;
    cantidad: number;
    fecha: Date;
    clienteId: string | null;
    cliente?: Cliente;
    notas: string | null;
    created_at?: Date;
}
