// =============================================================================
// TEST: LIST FLOTA DISPONIBLE USE CASE
// =============================================================================

import { ListFlotaDisponibleUseCase } from '../../src/application/use-cases/list-flota-disponible.use-case';
import { IUnidadRepository } from '../../src/domain/repositories/unidad.repository.interface';
import { ITerceroRepository } from '../../src/domain/repositories/tercero.repository.interface';

// Mocks de repositorios
const mockUnidadRepository: IUnidadRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByPatente: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  existsByPatente: jest.fn(),
};

const mockTerceroRepository: ITerceroRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNombre: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  existsByNombre: jest.fn(),
};

describe('ListFlotaDisponibleUseCase', () => {
  let useCase: ListFlotaDisponibleUseCase;

  beforeEach(() => {
    useCase = new ListFlotaDisponibleUseCase(mockUnidadRepository, mockTerceroRepository);
    jest.clearAllMocks();
  });

  it('debería listar unidades propias disponibles y terceros activos', async () => {
    // Arrange
    (mockUnidadRepository.findAll as jest.Mock).mockResolvedValue([
      {
        id: 'u1',
        patente: 'ABC123',
        marca: 'Mercedes',
        modelo: 'Actros',
        anio: '2020',
        tipo: 'semirremolque',
        tipoServicio: 'corta_distancia',
        estado: 'DISPONIBLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'u2',
        patente: 'XYZ789',
        marca: 'Volvo',
        modelo: 'FH',
        anio: '2021',
        tipo: 'rígido',
        tipoServicio: 'larga_distancia',
        estado: 'EN_RUTA', // No debería aparecer
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    (mockTerceroRepository.findAll as jest.Mock).mockResolvedValue([
      {
        id: 't1',
        razonSocial: 'Transportes López',
        tipoDocumento: 'CUIT',
        numeroDocumento: '30-12345678-9',
        patenteTractor: 'DEF456',
        tipoUnidad: 'Semi',
        tipoServicio: 'corta_distancia',
        estado: 'activo',
        nombreChofer: 'Juan Pérez',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't2',
        razonSocial: 'Transportes García',
        tipoDocumento: 'CUIT',
        numeroDocumento: '30-87654321-0',
        patenteTractor: 'GHI789',
        tipoUnidad: 'Chasis',
        tipoServicio: 'larga_distancia',
        estado: 'inactivo', // No debería aparecer
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'u1',
      tipoFlota: 'propia',
      label: 'ABC123 - Mercedes Actros',
      tipoServicio: 'corta_distancia',
    });
    expect(result[1]).toMatchObject({
      id: 't1',
      tipoFlota: 'tercero',
      label: 'Transportes López - DEF456',
      tipoServicio: 'corta_distancia',
      nombreChofer: 'Juan Pérez',
    });
  });

  it('debería filtrar por tipo_servicio', async () => {
    // Arrange
    (mockUnidadRepository.findAll as jest.Mock).mockResolvedValue([
      {
        id: 'u1',
        patente: 'ABC123',
        marca: 'Mercedes',
        modelo: 'Actros',
        anio: '2020',
        tipo: 'semirremolque',
        tipoServicio: 'larga_distancia',
        estado: 'DISPONIBLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'u2',
        patente: 'XYZ789',
        marca: 'Volvo',
        modelo: 'FH',
        anio: '2021',
        tipo: 'rígido',
        tipoServicio: 'corta_distancia',
        estado: 'DISPONIBLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    (mockTerceroRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.execute('larga_distancia');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].tipoServicio).toBe('larga_distancia');
  });

  it('debería retornar array vacío si no hay flota disponible', async () => {
    // Arrange
    (mockUnidadRepository.findAll as jest.Mock).mockResolvedValue([]);
    (mockTerceroRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toHaveLength(0);
  });
});
