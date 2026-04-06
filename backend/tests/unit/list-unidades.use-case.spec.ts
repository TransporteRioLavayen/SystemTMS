// =============================================================================
// TEST: LISTAR UNIDADES USE CASE
// =============================================================================

import { ListUnidadesUseCase } from '../../src/application/use-cases/list-unidades.use-case';
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

describe('ListUnidadesUseCase', () => {
  let useCase: ListUnidadesUseCase;

  beforeEach(() => {
    useCase = new ListUnidadesUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería listar todas las unidades', async () => {
    // Arrange
    const mockUnidades: Unidad[] = [
      {
        id: '1',
        patente: 'ABC123',
        marca: 'Mercedes Benz',
        modelo: 'Actros',
        anio: '2020',
        tipo: 'semirremolque',
        estado: 'DISPONIBLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        patente: 'XYZ789',
        marca: 'Volvo',
        modelo: 'FH',
        anio: '2021',
        tipo: 'rígido',
        estado: 'EN_RUTA',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findAll as jest.Mock).mockResolvedValue(mockUnidades);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledWith(false);
    expect(result).toHaveLength(2);
    expect(result[0].patente).toBe('ABC123');
  });

  it('debería incluir inactivas cuando se indica', async () => {
    // Arrange
    const mockUnidades: Unidad[] = [
      {
        id: '1',
        patente: 'ABC123',
        marca: 'Mercedes Benz',
        modelo: 'Actros',
        anio: '2020',
        tipo: 'semirremolque',
        estado: 'MANTENIMIENTO',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findAll as jest.Mock).mockResolvedValue(mockUnidades);

    // Act
    const result = await useCase.execute(true);

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledWith(true);
    expect(result).toHaveLength(1);
  });

  it('debería retornar array vacío cuando no hay unidades', async () => {
    // Arrange
    (mockRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toHaveLength(0);
  });
});