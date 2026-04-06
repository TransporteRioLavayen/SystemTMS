// =============================================================================
// TEST: LISTAR TERCEROS USE CASE
// =============================================================================

import { ListTercerosUseCase } from '../../src/application/use-cases/list-terceros.use-case';
import { ITerceroRepository } from '../../src/domain/repositories/tercero.repository.interface';
import { Tercero } from '../../src/domain/entities/tercero.entity';

// Mock del repositorio
const mockRepository: ITerceroRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNombre: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  existsByNombre: jest.fn(),
};

describe('ListTercerosUseCase', () => {
  let useCase: ListTercerosUseCase;

  beforeEach(() => {
    useCase = new ListTercerosUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería listar todos los terceros activos por defecto', async () => {
    // Arrange
    const mockTerceros: Tercero[] = [
      {
        id: '1',
        razonSocial: 'Distribuciones ABC',
        tipoDocumento: 'CUIT',
        numeroDocumento: '30-12345678-9',
        telefono: '351-1234567',
        patenteTractor: 'AB 123 CD',
        tipoUnidad: 'Semi',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        razonSocial: 'Cliente XYZ',
        tipoDocumento: 'DNI',
        numeroDocumento: '25123456',
        telefono: '351-7654321',
        patenteTractor: 'AC 456 DE',
        tipoUnidad: 'Chasis',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findAll as jest.Mock).mockResolvedValue(mockTerceros);

    // Act
    const result = await useCase.execute(false);

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledWith(false);
    expect(result).toHaveLength(2);
    expect(result[0].razonSocial).toBe('Distribuciones ABC');
  });

  it('debería incluir inactivos cuando se indica', async () => {
    // Arrange
    const mockTerceros: Tercero[] = [
      {
        id: '1',
        razonSocial: 'Proveedor Inactivo',
        tipoDocumento: 'CUIT',
        numeroDocumento: '30-99999999-9',
        patenteTractor: 'ZZ 999 ZZ',
        tipoUnidad: 'Utilitario',
        estado: 'inactivo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findAll as jest.Mock).mockResolvedValue(mockTerceros);

    // Act
    const result = await useCase.execute(true);

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledWith(true);
    expect(result).toHaveLength(1);
  });

  it('debería retornar array vacío cuando no hay terceros', async () => {
    // Arrange
    (mockRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toHaveLength(0);
  });
});