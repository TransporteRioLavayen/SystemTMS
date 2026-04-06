// =============================================================================
// TEST: CREAR TERCERO USE CASE
// =============================================================================

import { CreateTerceroUseCase } from '../../src/application/use-cases/create-tercero.use-case';
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

describe('CreateTerceroUseCase', () => {
  let useCase: CreateTerceroUseCase;

  beforeEach(() => {
    useCase = new CreateTerceroUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería crear un tercero válido', async () => {
    // Arrange
    const input = {
      razonSocial: 'Distribuciones ABC',
      tipoDocumento: 'CUIT' as const,
      numeroDocumento: '30-12345678-9',
      telefono: '351-1234567',
      email: 'contacto@abc.com',
      patenteTractor: 'AB 123 CD',
      tipoUnidad: 'Semi' as const,
    };

    const mockTercero: Tercero = {
      id: '1',
      ...input,
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.existsByNombre as jest.Mock).mockResolvedValue(false);
    (mockRepository.create as jest.Mock).mockResolvedValue(mockTercero);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepository.existsByNombre).toHaveBeenCalledWith('Distribuciones ABC');
    expect(mockRepository.create).toHaveBeenCalledWith(input);
    expect(result.razonSocial).toBe('Distribuciones ABC');
  });

  it('debería lanzar ValidationError si la razón social ya existe', async () => {
    // Arrange
    const input = {
      razonSocial: 'Distribuciones ABC',
      tipoDocumento: 'CUIT' as const,
      numeroDocumento: '30-12345678-9',
      patenteTractor: 'AB 123 CD',
      tipoUnidad: 'Semi' as const,
    };

    (mockRepository.existsByNombre as jest.Mock).mockResolvedValue(true);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow('Ya existe un tercero con esta razón social');
  });

  it('debería crear un tercero con campos opcionales', async () => {
    // Arrange
    const input = {
      razonSocial: 'Transportes XYZ',
      tipoDocumento: 'DNI' as const,
      numeroDocumento: '25123456',
      telefono: '351-9876543',
      email: 'contacto@xyz.com',
      patenteTractor: 'AC 456 DE',
      patenteAcoplado: 'FG 789 HI',
      tipoUnidad: 'Acoplado' as const,
      nombreChofer: 'Juan Pérez',
      dniChofer: '20123456',
      vencimientoLicencia: '2025-12-31',
    };

    const mockTercero: Tercero = {
      id: '2',
      ...input,
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.existsByNombre as jest.Mock).mockResolvedValue(false);
    (mockRepository.create as jest.Mock).mockResolvedValue(mockTercero);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.nombreChofer).toBe('Juan Pérez');
    expect(result.patenteAcoplado).toBe('FG 789 HI');
  });
});