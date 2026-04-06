// =============================================================================
// TEST: CREAR UNIDAD USE CASE
// =============================================================================

import { CreateUnidadUseCase } from '../../src/application/use-cases/create-unidad.use-case';
import { IUnidadRepository } from '../../src/domain/repositories/unidad.repository.interface';
import { Unidad } from '../../src/domain/entities/unidad.entity';

// Mock del repositorio
const mockRepository: IUnidadRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByPatente: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  existsByPatente: jest.fn(),
};

describe('CreateUnidadUseCase', () => {
  let useCase: CreateUnidadUseCase;

  beforeEach(() => {
    useCase = new CreateUnidadUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería crear una unidad válida', async () => {
    // Arrange
    const input = {
      patente: 'ABC123',
      marca: 'Mercedes Benz',
      modelo: 'Actros',
      anio: '2020',
      tipo: 'semirremolque',
    };

    const mockUnidad: Unidad = {
      id: '1',
      ...input,
      estado: 'DISPONIBLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.existsByPatente as jest.Mock).mockResolvedValue(false);
    (mockRepository.create as jest.Mock).mockResolvedValue(mockUnidad);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepository.existsByPatente).toHaveBeenCalledWith('ABC123');
    expect(mockRepository.create).toHaveBeenCalledWith(input);
    expect(result.patente).toBe('ABC123');
  });

  it('debería lanzar ValidationError si la patente ya existe', async () => {
    // Arrange
    const input = {
      patente: 'ABC123',
      marca: 'Mercedes Benz',
      modelo: 'Actros',
      anio: '2020',
      tipo: 'semirremolque',
    };

    (mockRepository.existsByPatente as jest.Mock).mockResolvedValue(true);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow('Ya existe una unidad con esta patente');
  });

  it('debería crear una unidad con campos opcionales', async () => {
    // Arrange
    const input = {
      patente: 'XYZ789',
      marca: 'Volvo',
      modelo: 'FH',
      anio: '2021',
      tipo: 'rígido',
      vtv: '2025-06-15',
      seguro: '2025-12-31',
    };

    const mockUnidad: Unidad = {
      id: '2',
      ...input,
      estado: 'DISPONIBLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.existsByPatente as jest.Mock).mockResolvedValue(false);
    (mockRepository.create as jest.Mock).mockResolvedValue(mockUnidad);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.vtv).toBe('2025-06-15');
    expect(result.seguro).toBe('2025-12-31');
  });
});