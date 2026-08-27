import { useState, useEffect } from "react";

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
                className="field"
              />
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-hairline">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/60">
            {itemsFiltrados.map((item, index) => {
              const customClassName = getRowClassName?.(item) || '';
              const customStyle = getRowStyle?.(item) || {};
              const hoverClass = onRowClick ? 'hover:bg-ivory-100/70 cursor-pointer' : 'hover:bg-ivory-100/40';

              return (
                <tr
                  key={(item as any).id || index}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-all duration-150 ease-in-out ${customClassName} ${hoverClass}`}
                  style={customStyle}
                >
                  {renderCells(item).map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-4 text-sm text-ink-soft">
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {itemsFiltrados.length === 0 && (
          <div className="text-center py-12 text-ink-faint text-sm">
            No hay resultados para mostrar.
          </div>
        )}
      </div>
    </div>
  );
};
