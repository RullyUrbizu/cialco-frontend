import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Home } from './Home';
import { useColectas } from '../hooks/useColectas';
import { BrowserRouter } from 'react-router-dom';

// Mock the hook
vi.mock('../hooks/useColectas', () => ({
  useColectas: vi.fn(),
}));

// Mock jsPDF and XLSX to avoid issues during tests
vi.mock('jspdf', () => ({ default: vi.fn(() => ({ setFont: vi.fn(), setFontSize: vi.fn(), setTextColor: vi.fn(), text: vi.fn(), save: vi.fn(), internal: { pageSize: { width: 210, height: 297 } } })) }));
vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));
vi.mock('xlsx', () => ({ utils: { json_to_sheet: vi.fn(), book_new: vi.fn(), book_append_sheet: vi.fn() }, writeFile: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('./ColectaModal', () => ({
  ColectaModal: ({ isOpen }: any) => isOpen ? <div>Modal Open</div> : null
}));

vi.mock('./lista/Lista', () => ({
  Lista: ({ items, renderCells }: any) => (
    <table>
      <tbody>
        {items.map((item: any, i: number) => (
          <tr key={i}>{renderCells(item).map((cell: any, j: number) => <td key={j}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}));

describe('Home Component', () => {
  const mockColectas = [
    {
      id: '1',
      toro: { id: 't-1', nombre: 'Toro Test', raza: 'Angus' },
      cliente: { id: 'c-1', razonSocial: 'Cliente Test' },
      cantidad: 100,
      fecha: '2025-03-12',
      contenedores: [{ termo: { codigo: 'TR-1' }, canastillo: { codigo: 'CN-1' } }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    (useColectas as any).mockReturnValue({
      colectas: [],
      loading: true,
      hasMore: false,
      searchTerm: '',
    });

    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Should show skeletons
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders list of colectas', () => {
    (useColectas as any).mockReturnValue({
      colectas: mockColectas,
      loading: false,
      hasMore: false,
      searchTerm: '',
      total: 1,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Toro Test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cliente Test').length).toBeGreaterThan(0);
  });

  it('handles search input', () => {
    const setSearchTerm = vi.fn();
    (useColectas as any).mockReturnValue({
      colectas: mockColectas,
      loading: false,
      hasMore: false,
      searchTerm: '',
      setSearchTerm,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/Buscar por toro/i);
    fireEvent.change(input, { target: { value: 'nuevo toro' } });

    expect(setSearchTerm).toHaveBeenCalledWith('nuevo toro');
  });

  it('opens create modal when clicking "Registrar nueva colecta"', () => {
    (useColectas as any).mockReturnValue({
      colectas: mockColectas,
      loading: false,
      hasMore: false,
      searchTerm: '',
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const btns = screen.getAllByText(/Registrar nueva colecta|\+ Nueva Colecta/i);
    fireEvent.click(btns[0]);

    // Check if mock modal appears
    expect(screen.getByText('Modal Open')).toBeInTheDocument();
  });
});
