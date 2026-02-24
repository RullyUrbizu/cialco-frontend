import { useState, useEffect } from "react";
// import { ListaRow } from "./ListaRow"; // Eliminamos ListaRow para integrar todo aquí y tener mejor control de estilos o lo mantenemos si es complejo.
// Para simplificar y asegurar el estilo, voy a renderizar las filas directamente aquí o actualizar ListaRow.
// Dado que no vi ListaRow, asumiré que puedo renderizar aquí.
// Espera, vi ListaRow en el list_dir? No, no lo vi en list_dir de src/components/lista/
// Ah, en el step 9 vi "Lista" folder.
// Vamos a ver qué tiene la carpeta lista.
// Mejor asumo que ListaRow existe y lo uso, O lo reescribo aquí mismo para simplificar.
// El código original importaba ListaRow.
// Voy a reescribir Lista para incluir la renderización de filas aquí mismo para asegurar el estilo "Lindo".

interface ListaProps<T> {
  items: T[];
  columns: string[];
  filterFields?: string[];
  renderCells: (item: T) => React.ReactNode[];
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string;
  getRowStyle?: (item: T) => React.CSSProperties;
}

export const Lista = <T,>({ items, columns, filterFields, renderCells, onRowClick, getRowClassName, getRowStyle }: ListaProps<T>) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [itemsFiltrados, setItemsFiltrados] = useState(items);

  useEffect(() => {
    let filtrados = items;
    if (filterFields) {
      filtrados = items.filter((item) =>
        filterFields.every((field) => {
          const valor = (field.split(".").reduce((acc: any, key) => acc?.[key], item) || "").toString().toLowerCase();
          const filtro = (filters[field] || "").toLowerCase();
          return valor.includes(filtro);
        })
      );
    }
    setItemsFiltrados(filtrados);
  }, [filters, items, filterFields]);

  const handleChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  return (
    <div>
      {/* Inputs de filtrado (si los hay) */}
      {filterFields && (
        <div className="flex gap-4 mb-6">
          {filterFields.map((field) => (
            <div key={field} className="flex-1">
              <input
                type="text"
                placeholder={`Filtrar por ${field}`}
                value={filters[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>

          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-blue-200/30">
            {itemsFiltrados.map((item, index) => {
              const customClassName = getRowClassName?.(item) || '';
              const customStyle = getRowStyle?.(item) || {};
              const hoverClass = onRowClick ? 'hover:bg-white/40 cursor-pointer' : 'hover:bg-white/20';

              return (
                <tr
                  key={(item as any).id || index}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-all duration-150 ease-in-out ${customClassName} ${hoverClass}`}
                  style={customStyle}
                >
                  {renderCells(item).map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 text-sm text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {itemsFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay resultados para mostrar.
          </div>
        )}
      </div>
    </div>
  );
};
