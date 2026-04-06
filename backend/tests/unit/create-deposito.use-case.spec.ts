// =============================================================================
// TEST: CREAR DEPOSITO USE CASE
// =============================================================================

import { CreateDepositoUseCase, ValidationError } from '../../src/application/use-cases/create-deposito.use-case';
import { IDepositoRepository } from '../../src/domain/repositories/deposito.repository.interface';
import { Deposito } from '../../src/domain/entities/deposito.entity';

// Mock del repositorio
const mockRepository: IDepositoRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  existsByNombre: jest.fn(),
};

describe('CreateDepositoUseCase', () => {
  let useCase: CreateDepositoUseCase;

  beforeEach(() => {
    useCase = new CreateDepositoUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería crear un depósito válido', async () => {
    // Arrange
    const input = {
      nombre: 'Depósito Centro',
      ubicacion: 'Av. Principal 123',
      capacidad: 1000,
    };

    const mockCreatedDeposito: Deposito = {
      id: 'uuid-123',
      nombre: 'Depósito Centro',
      ubicacion: 'Av. Principal 123',
      capacidad: 1000,
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.existsByNombre as jest.Mock).mockResolvedValue(false);
    (mockRepository.create as jest.Mock).mockResolvedValue(mockCreatedDeposito);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepository.existsByNombre).toHaveBeenCalledWith('Depósito Centro');
    expect(mockRepository.create).toHaveBeenCalledWith(input);
    expect(result.nombre).toBe('Depósito Centro');
    expect(result.estado).toBe('activo');
  });

  it('debería lanzar ValidationError si el nombre ya existe', async () => {
    // Arrange
    const input = {
      nombre: 'Depósito Centro',
      ubicacion: 'Av. Principal 123',
      capacidad: 1000,
    };

    (mockRepository.existsByNombre as jest.Mock).mockResolvedValue(true);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    await expect(useCase.execute(input)).rejects.toThrow('Ya existe un depósito con ese nombre');
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('debería crear un depósito con campos opcionales', async () => {
    // Arrange
    const input = {
      nombre: 'Depósito Centro',
      ubicacion: 'Av. Principal 123',
      capacidad: 1000,
      encargado: 'Juan Pérez',
      lat: -34.6037,
      lng: -58.3816,
    };

    const mockCreatedDeposito: Deposito = {
      id: 'uuid-123',
      nombre: 'Depósito Centro',
      ubicacion: 'Av. Principal 123',
      capacidad: 1000,
      encargado: 'Juan Pérez',
      lat: -34.6037,
      lng: -58.3816,
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.existsByNombre as jest.Mock).mockResolvedValue(false);
    (mockRepository.create as jest.Mock).mockResolvedValue(mockCreatedDeposito);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.encargado).toBe('Juan Pérez');
    expect(result.lat).toBe(-34.6037);
    expect(result.lng).toBe(-58.3816);
  });
});