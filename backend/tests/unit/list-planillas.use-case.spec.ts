// =============================================================================
// TEST: LISTAR PLANILLAS USE CASE
// =============================================================================

import { ListPlanillasUseCase } from '../../src/application/use-cases/list-planillas.use-case';
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
};

describe('ListPlanillasUseCase', () => {
  let useCase: ListPlanillasUseCase;

  beforeEach(() => {
    useCase = new ListPlanillasUseCase(mockRepository);
    jest.clearAllMocks();
  });

  it('debería listar todas las planillas sin filtro', async () => {
    // Arrange
    const mockPlanillas: Planilla[] = [
      {
        id: '1',
        sucursalOrigen: 'Centro',
        sucursalDestino: 'Norte',
        fechaSalidaEstimada: '2024-01-15',
        fechaLlegadaEstimada: '2024-01-16',
        camion: 'ABC-123',
        chofer: 'Pedro García',
        estado: 'borrador',
        remitos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        sucursalOrigen: 'Norte',
        fechaSalidaEstimada: '2024-01-14',
        fechaLlegadaEstimada: '2024-01-15',
        camion: 'DEF-456',
        chofer: 'Jorge López',
        estado: 'viaje',
        remitos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findAll as jest.Mock).mockResolvedValue(mockPlanillas);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledWith();
    expect(result).toHaveLength(2);
    expect(result[0].sucursalOrigen).toBe('Centro');
  });

  it('debería filtrar por estado cuando se indica', async () => {
    // Arrange
    const mockPlanillas: Planilla[] = [
      {
        id: '1',
        sucursalOrigen: 'Centro',
        fechaSalidaEstimada: '2024-01-15',
        fechaLlegadaEstimada: '',
        camion: 'ABC-123',
        chofer: 'Pedro García',
        estado: 'borrador',
        remitos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRepository.findByEstado as jest.Mock).mockResolvedValue(mockPlanillas);

    // Act
    const result = await useCase.execute('borrador');

    // Assert
    expect(mockRepository.findByEstado).toHaveBeenCalledWith('borrador');
    expect(result).toHaveLength(1);
    expect(result[0].estado).toBe('borrador');
  });

  it('debería retornar array vacío cuando no hay planillas', async () => {
    // Arrange
    (mockRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toHaveLength(0);
  });
});
