// =============================================================================
// TEST: CREAR CHOFER USE CASE
// =============================================================================

import { CreateChoferUseCase } from '../../src/application/use-cases/create-chofer.use-case';
import { IChoferRepository } from '../../src/domain/repositories/chofer.repository.interface';
import { Chofer } from '../../src/domain/entities/chofer.entity';

// Mock del repositorio
const mockRepository: IChoferRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByDni: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  existsByDni: jest.fn(),
};

describe('CreateChoferUseCase', () => {
  let useCase: CreateChoferUseCase;

  beforeEach(() => {
    useCase = new CreateChoferUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería crear un chofer válido', async () => {
    // Arrange
    const input = {
      nombre: 'Pedro García',
      dni: '12345678',
      licencia: 'CD-123456',
      vencimientoLicencia: '2026-12-31',
      telefono: '351-1234567',
    };

    const mockChofer: Chofer = {
      id: '1',
      ...input,
      estado: 'DISPONIBLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.existsByDni as jest.Mock).mockResolvedValue(false);
    (mockRepository.create as jest.Mock).mockResolvedValue(mockChofer);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepository.existsByDni).toHaveBeenCalledWith('12345678');
    expect(mockRepository.create).toHaveBeenCalledWith(input);
    expect(result.nombre).toBe('Pedro García');
  });

  it('debería lanzar ValidationError si el DNI ya existe', async () => {
    // Arrange
    const input = {
      nombre: 'Pedro García',
      dni: '12345678',
      licencia: 'CD-123456',
      vencimientoLicencia: '2026-12-31',
      telefono: '351-1234567',
    };

    (mockRepository.existsByDni as jest.Mock).mockResolvedValue(true);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow('Ya existe un chofer con este DNI');
  });
});