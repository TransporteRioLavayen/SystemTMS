// =============================================================================
// TEST: CREAR PLANILLA USE CASE
// =============================================================================

import { CreatePlanillaUseCase } from '../../src/application/use-cases/create-planilla.use-case';
import { IPlanillaRepository } from '../../src/domain/repositories/planilla.repository.interface';
import { Planilla } from '../../src/domain/entities/planilla.entity';

// Mock del repositorio
const mockRepository: IPlanillaRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEstado: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  finalizarControl: jest.fn(),
  generarSeguimientoRemitos: jest.fn(),
};

describe('CreatePlanillaUseCase', () => {
  let useCase: CreatePlanillaUseCase;

  beforeEach(() => {
    useCase = new CreatePlanillaUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería crear una planilla en estado borrador', async () => {
    // Arrange
    const mockPlanilla: Planilla = {
      id: 'uuid-123',
      sucursalOrigen: 'Centro',
      sucursalDestino: 'Norte',
      fechaSalidaEstimada: '2024-01-15',
      fechaLlegadaEstimada: '',
      camion: 'ABC-123',
      chofer: 'Pedro García',
      estado: 'borrador',
      comentarios: 'Test comments',
      remitos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.create as jest.Mock).mockResolvedValue(mockPlanilla);

    // Act
    const result = await useCase.execute({
      sucursalOrigen: 'Centro',
      sucursalDestino: 'Norte',
      fechaSalidaEstimada: '2024-01-15',
      camion: 'ABC-123',
      chofer: 'Pedro García',
      comentarios: 'Test comments',
    });

    // Assert
    expect(mockRepository.create).toHaveBeenCalledWith({
      sucursalOrigen: 'Centro',
      sucursalDestino: 'Norte',
      fechaSalidaEstimada: '2024-01-15',
      fechaLlegadaEstimada: '',
      camion: 'ABC-123',
      chofer: 'Pedro García',
      estado: 'borrador',
      comentarios: 'Test comments',
      remitos: [],
    });
    expect(result.estado).toBe('borrador');
    expect(result.sucursalOrigen).toBe('Centro');
  });

  it('debería asignar fechaLlegadaEstimada vacía si no se proporciona', async () => {
    // Arrange
    const mockPlanilla: Planilla = {
      id: 'uuid-456',
      sucursalOrigen: 'Norte',
      fechaSalidaEstimada: '2024-01-15',
      fechaLlegadaEstimada: '',
      camion: 'DEF-456',
      chofer: 'Jorge López',
      estado: 'borrador',
      remitos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRepository.create as jest.Mock).mockResolvedValue(mockPlanilla);

    // Act
    const result = await useCase.execute({
      sucursalOrigen: 'Norte',
      fechaSalidaEstimada: '2024-01-15',
      camion: 'DEF-456',
      chofer: 'Jorge López',
    });

    // Assert
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fechaLlegadaEstimada: '',
      })
    );
  });
});
