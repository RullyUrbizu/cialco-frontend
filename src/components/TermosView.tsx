import { useEffect, useState } from "react";
import { useColectas } from "../hooks/useColectas";
import { Card } from "./ui/Card";
import type { Colecta } from "../Modelo/Colecta";

interface TermoOcupacion {
    codigo: string;
    capacidadTotal: number;
    ocupado: number;
    porcentaje: number;
}

export const TermosView = () => {
    const { colectas, loading, error } = useColectas();
    const [termosData, setTermosData] = useState<TermoOcupacion[]>([]);

    useEffect(() => {
        if (!colectas) return;

        // Agrupar contenedores por termo y calcular ocupación
        const termoMap = new Map<string, number>();

        colectas.forEach((c: Colecta) => {
            // Ahora iteramos sobre los contenedores de cada colecta
            if (c.contenedores && c.contenedores.length > 0) {
                c.contenedores.forEach(contenedor => {
                    const codigo = contenedor.termo?.codigo;
                    if (codigo) {
                        const stockActual = contenedor.stockActual ?? 0;
                        termoMap.set(codigo, (termoMap.get(codigo) || 0) + stockActual);
                    }
                });
            }
        });

        // Calcular capacidad según el código del termo
        const getCapacidad = (codigo: string): number => {
            const codigoUpper = codigo.toUpperCase();
            if (codigoUpper === "CH I" || codigoUpper === "CH II" || codigoUpper === "CH III" || codigoUpper === "CH IV" || codigoUpper === "ChH II" || codigoUpper === "47/11") {
                return 3990; // 665 pajuelas x 6 canastillos
            }
            return 1140; // 190 pajuelas x 6 canastillos
        };

        // Crear array de termos con su ocupación
        const termosArray: TermoOcupacion[] = Array.from(termoMap.entries()).map(([codigo, ocupado]) => {
            const capacidadTotal = getCapacidad(codigo);
            const porcentaje = Math.round((ocupado / capacidadTotal) * 100);
            return { codigo, capacidadTotal, ocupado, porcentaje };
        });

        // Ordenar por código
        termosArray.sort((a, b) => a.codigo.localeCompare(b.codigo));

        setTermosData(termosArray);
    }, [colectas]);

    const getColorByPercentage = (porcentaje: number): string => {
        if (porcentaje >= 90) return "bg-red-500";
        if (porcentaje >= 70) return "bg-orange-500";
        if (porcentaje >= 50) return "bg-yellow-500";
        return "bg-green-500";
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando termos...</div>;
    if (error) return <div className="p-6 text-red-600 bg-red-50 rounded-lg">{error}</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ocupación de Termos</h1>
                <p className="text-gray-500 mt-1">Visualiza el estado de capacidad de cada termo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {termosData.map((termo) => (
                    <Card key={termo.codigo} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{termo.codigo}</h3>
                            <span className="text-2xl font-bold text-blue-600">{termo.porcentaje}%</span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                                <div
                                    className={`h-full ${getColorByPercentage(termo.porcentaje)} transition-all duration-500 flex items-center justify-center text-white text-xs font-semibold`}
                                    style={{ width: `${Math.min(termo.porcentaje, 100)}%` }}
                                >
                                    {termo.porcentaje > 10 && `${termo.porcentaje}%`}
                                </div>
                            </div>
                        </div>

                        {/* Información detallada */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ocupado:</span>
                                <span className="font-semibold text-gray-900">{termo.ocupado} pajuelas</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Disponible:</span>
                                <span className="font-semibold text-green-600">
                                    {termo.capacidadTotal - termo.ocupado} pajuelas
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-2">
                                <span className="text-gray-600">Capacidad Total:</span>
                                <span className="font-semibold text-gray-900">{termo.capacidadTotal} pajuelas</span>
                            </div>
                        </div>

                        {/* Indicador visual de estado */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            {termo.porcentaje >= 100 && (
                                <div className="text-xs text-red-600 font-semibold">⚠️ Lleno</div>
                            )}
                            {termo.porcentaje >= 90 && termo.porcentaje < 100 && (
                                <div className="text-xs text-red-600 font-semibold">⚠️ Casi lleno</div>
                            )}
                            {termo.porcentaje >= 70 && termo.porcentaje < 90 && (
                                <div className="text-xs text-orange-600 font-semibold">⚡ Alta ocupación</div>
                            )}
                            {termo.porcentaje < 70 && (
                                <div className="text-xs text-green-600 font-semibold">✓ Espacio disponible</div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {termosData.length === 0 && (
                <Card className="p-8 text-center text-gray-500">
                    No hay termos registrados con colectas.
                </Card>
            )}
        </div>
    );
};
