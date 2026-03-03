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
    remito: string | null;
    inventario?: {
        id: string;
        colecta: {
            id: string;
            fecha: Date;
            toro: {
                id: string;
                nombre: string;
                raza: string;
            };
            cliente: {
                id: string;
                razonSocial: string;
            };
        };
    };
    created_at?: Date;
}
