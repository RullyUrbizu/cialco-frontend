import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToroForm } from './TorosForm';
import { api } from '../api/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RazaEnum } from '../Modelo/RazaEnum';

// Mock the API module
vi.mock('../api/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TorosForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <MemoryRouter>
        <ToroForm />
      </MemoryRouter>
    );

    expect(screen.getByText('Agregar Toro')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Raza/i)).toBeInTheDocument();
  });

  it('handles form submission for new toro', async () => {
    (api.post as any).mockResolvedValue({ status: 201 });

    render(
      <MemoryRouter>
        <ToroForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Toro 1' } });
    fireEvent.change(screen.getByLabelText(/Raza/i), { target: { value: RazaEnum.PH } });
    
    fireEvent.click(screen.getByText(/Crear Toro/i));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/toros', {
        nombre: 'Toro 1',
        raza: RazaEnum.PH,
      });
    });
  });

  it('loads data and renders edit form when ID is present', async () => {
    const mockToro = { id: '123', nombre: 'Toro Editable', raza: RazaEnum.AA };
    (api.get as any).mockResolvedValue({ data: mockToro });

    render(
      <MemoryRouter initialEntries={['/editar-toro/123']}>
        <Routes>
          <Route path="/editar-toro/:id" element={<ToroForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/toros/123');
      expect(screen.getByDisplayValue('Toro Editable')).toBeInTheDocument();
      expect(screen.getByDisplayValue(RazaEnum.AA)).toBeInTheDocument();
      expect(screen.getByText('Editar Toro')).toBeInTheDocument();
    });
  });

  it('handles form submission for editing toro', async () => {
    const mockToro = { id: '123', nombre: 'Toro Editable', raza: RazaEnum.AA };
    (api.get as any).mockResolvedValue({ data: mockToro });
    (api.put as any).mockResolvedValue({ status: 200 });

    render(
      <MemoryRouter initialEntries={['/editar-toro/123']}>
        <Routes>
          <Route path="/editar-toro/:id" element={<ToroForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('Toro Editable')).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('Toro Editable'), { target: { value: 'Toro Actualizado' } });
    fireEvent.click(screen.getByText(/Guardar Cambios/i));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/toros/123', {
        nombre: 'Toro Actualizado',
        raza: RazaEnum.AA,
      });
    });
  });
});
