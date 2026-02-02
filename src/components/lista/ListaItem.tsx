interface ListaItemProps {
  children: React.ReactNode;
  className?: string;
}

export const ListaItem = ({ children, className }: ListaItemProps) => {
  return <td className={`px-6 py-4 whitespace-nowrap ${className || ""}`}>{children}</td>;
};
