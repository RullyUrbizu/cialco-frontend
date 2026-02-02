import { ListaItem } from "./ListaItem";

interface ListaRowProps<T> {
  item: T;
  renderCells: (item: T) => React.ReactNode[];
}

export const ListaRow = <T,>({ item, renderCells }: ListaRowProps<T>) => {
  return <tr className="hover:bg-gray-50 transition-colors">{renderCells(item).map((cell, i) => (
    <ListaItem key={i}>{cell}</ListaItem>
  ))}</tr>;
};
