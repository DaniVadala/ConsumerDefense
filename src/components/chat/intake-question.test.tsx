import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntakeQuestion } from './intake-question';

vi.mock('@/lib/analytics', () => ({
  trackChatIntakeAnswer: vi.fn(),
}));

const defaultProps = {
  pregunta: '¿Cuál es tu proveedor?',
  opciones: ['Claro', 'Movistar', 'Telecom', 'Otro'],
  paso_actual: 1,
  paso_total: 4,
  onSelect: vi.fn(),
  isActive: true,
};

describe('IntakeQuestion', () => {
  it('renderiza la pregunta y las opciones', () => {
    render(<IntakeQuestion {...defaultProps} />);
    expect(screen.getByText('¿Cuál es tu proveedor?')).toBeInTheDocument();
    expect(screen.getByText('Claro')).toBeInTheDocument();
    expect(screen.getByText('Movistar')).toBeInTheDocument();
    expect(screen.getByText('Otro')).toBeInTheDocument();
  });

  it('llama a onSelect con la opción clickeada', async () => {
    const onSelect = vi.fn();
    render(<IntakeQuestion {...defaultProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Claro'));
    expect(onSelect).toHaveBeenCalledWith('Claro');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('no llama a onSelect dos veces si el usuario hace doble click', async () => {
    const onSelect = vi.fn();
    render(<IntakeQuestion {...defaultProps} onSelect={onSelect} />);
    await userEvent.dblClick(screen.getByText('Claro'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('deshabilita los otros chips tras seleccionar uno', async () => {
    render(<IntakeQuestion {...defaultProps} />);
    await userEvent.click(screen.getByText('Movistar'));
    const claroBtn = screen.getByText('Claro').closest('button')!;
    expect(claroBtn).toBeDisabled();
  });

  it('ignora clicks cuando isActive es false', async () => {
    const onSelect = vi.fn();
    render(<IntakeQuestion {...defaultProps} onSelect={onSelect} isActive={false} />);
    await userEvent.click(screen.getByText('Claro'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('flujo "Otro": muestra input libre y llama a onSelect al confirmar con Enter', async () => {
    const onSelect = vi.fn();
    render(<IntakeQuestion {...defaultProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Otro'));
    const input = screen.getByPlaceholderText('Escribí tu respuesta...');
    expect(input).toBeInTheDocument();
    await userEvent.type(input, 'Mi operadora personalizada');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('Mi operadora personalizada');
  });

  it('flujo "Otro": no llama a onSelect si el input está vacío', async () => {
    const onSelect = vi.fn();
    render(<IntakeQuestion {...defaultProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Otro'));
    await userEvent.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
