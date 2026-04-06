// =============================================================================
// TEST: LISTAR CHOFERES USE CASE
// =============================================================================

import { ListChoferesUseCase } from '../../src/application/use-cases/list-choferes.use-case';
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

describe('ListChoferesUseCase', () => {
  let useCase: ListChoferesUseCase;

  beforeEach(() => {
    useCase = new ListChoferesUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería listar todos los choferes', async () => {
    // Arrange
    const mockChoferes: Chofer[] = [
      {
        id: '1',
        nombre: 'Pedro García',
        dni: '12345678',
        licencia: 'CD-123456',
        vencimientoLicencia: '2026-12-31',
        telefono: '351-1234567',
        estado: 'DISPONIBLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        nombre: 'Jorge López',
        dni: '23456789',
        licencia: 'CD-234567',
        vencimientoLicencia: '2025-06-30',
        telefono: '351-2345678',
        estado: 'DISPONIBLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findAll as jest.Mock).mockResolvedValue(mockChoferes);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledWith(false);
    expect(result).toHaveLength(2);
    expect(result[0].nombre).toBe('Pedro García');
  });

  it('debería retornar array vacío cuando no hay choferes', async () => {
    // Arrange
    (mockRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toHaveLength(0);
  });
});