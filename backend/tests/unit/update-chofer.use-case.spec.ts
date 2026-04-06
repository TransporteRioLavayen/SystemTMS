// =============================================================================
// TEST: ACTUALIZAR CHOFER USE CASE
// =============================================================================

import { UpdateChoferUseCase } from '../../src/application/use-cases/update-chofer.use-case';
import { IChoferRepository } from '../../src/domain/repositories/chofer.repository.interface';
import { Chofer } from '../../src/domain/entities/chofer.entity';

const mockRepository: IChoferRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByDni: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  existsByDni: jest.fn(),
};

describe('UpdateChoferUseCase', () => {
  let useCase: UpdateChoferUseCase;

  beforeEach(() => {
    useCase = new UpdateChoferUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería actualizar un chofer existente', async () => {
    const choferExistente: Chofer = {
      id: '1',
      nombre: 'Pedro García',
      dni: '12345678',
      licencia: 'CD-123456',
      vencimientoLicencia: '2026-12-31',
      telefono: '351-1234567',
      estado: 'DISPONIBLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const input = {
      nombre: 'Pedro García Actualizado',
      telefono: '351-9876543',
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue(choferExistente);
    (mockRepository.update as jest.Mock).mockResolvedValue({
      ...choferExistente,
      ...input,
    });

    const result = await useCase.execute('1', input);

    expect(mockRepository.findById).toHaveBeenCalledWith('1');
    expect(mockRepository.update).toHaveBeenCalledWith('1', input);
    expect(result.nombre).toBe('Pedro García Actualizado');
  });

  it('debería lanzar error si el chofer no existe', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute('999', { nombre: 'Test' })
    ).rejects.toThrow('Chofer no encontrado');
  });

  it('debería actualizar solo el estado del chofer', async () => {
    const choferExistente: Chofer = {
      id: '1',
      nombre: 'Pedro García',
      dni: '12345678',
      licencia: 'CD-123456',
      vencimientoLicencia: '2026-12-31',
      telefono: '351-1234567',
      estado: 'DISPONIBLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue(choferExistente);
    (mockRepository.update as jest.Mock).mockResolvedValue({
      ...choferExistente,
      estado: 'EN_RUTA',
    });

    const result = await useCase.execute('1', { estado: 'EN_RUTA' });

    expect(result.estado).toBe('EN_RUTA');
  });
});
