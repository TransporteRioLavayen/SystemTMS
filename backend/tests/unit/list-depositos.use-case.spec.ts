// =============================================================================
// TEST: LISTAR DEPOSITOS USE CASE
// =============================================================================

import { ListDepositosUseCase } from '../../src/application/use-cases/list-depositos.use-case';
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

describe('ListDepositosUseCase', () => {
  let useCase: ListDepositosUseCase;

  beforeEach(() => {
    useCase = new ListDepositosUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería listar todos los depósitos activos por defecto', async () => {
    // Arrange
    const mockDepositos: Deposito[] = [
      {
        id: '1',
        nombre: 'Depósito Centro',
        ubicacion: 'Av. Principal 123',
        capacidad: 1000,
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        nombre: 'Depósito Norte',
        ubicacion: 'Av. Norte 456',
        capacidad: 500,
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findAll as jest.Mock).mockResolvedValue(mockDepositos);

    // Act
    const result = await useCase.execute(false);

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledWith(false);
    expect(result).toHaveLength(2);
    expect(result[0].nombre).toBe('Depósito Centro');
  });

  it('debería incluir inactivos cuando se indica', async () => {
    // Arrange
    const mockDepositos: Deposito[] = [
      {
        id: '1',
        nombre: 'Depósito Centro',
        ubicacion: 'Av. Principal 123',
        capacidad: 1000,
        estado: 'inactivo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findAll as jest.Mock).mockResolvedValue(mockDepositos);

    // Act
    const result = await useCase.execute(true);

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledWith(true);
    expect(result).toHaveLength(1);
    expect(result[0].estado).toBe('inactivo');
  });

  it('debería retornar array vacío cuando no hay depósitos', async () => {
    // Arrange
    (mockRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toHaveLength(0);
  });
});