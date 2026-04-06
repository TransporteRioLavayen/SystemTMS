// =============================================================================
// TESTS DE INTEGRACIÓN - API PLANILLAS
// =============================================================================
// Tests para verificar el flujo completo de gestión de cargas
// IMPORTANTE: Estos tests asumen que el servidor ya está corriendo en localhost:3001

import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Variables globales para los tests
let createdPlanillaId: string;
let testPlanillaData = {
  sucursalOrigen: 'Sucursal Central',
  sucursalDestino: 'Sucursal Norte',
  fechaSalidaEstimada: new Date().toISOString(),
  fechaLlegadaEstimada: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  camion: 'ABC-123',
  chofer: 'Juan Pérez',
  remitos: [
    {
      remitente: 'Empresa A',
      numeroRemito: 'REM-001',
      destinatario: 'Cliente B',
      bultos: 5,
      valorDeclarado: 1000,
      direccion: 'Calle Falsa 123',
      whatsapp: '3511234567'
    },
    {
      remitente: 'Empresa C',
      numeroRemito: 'REM-002',
      destinatario: 'Cliente D',
      bultos: 3,
      valorDeclarado: 500,
      direccion: 'Av. Principal 456',
      whatsapp: '3519876543'
    }
  ]
};

describe('API - Módulo de Gestión de Cargas (Planillas)', () => {
  
  // =============================================================================
  // TEST 1: Crear una nueva planilla (borrador)
  // =============================================================================
  describe('POST /api/planillas - Crear Planilla', () => {
    it('debería crear una planilla en estado borrador con remitos', async () => {
      const response = await request(BASE_URL)
        .post('/api/planillas')
        .send(testPlanillaData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.estado).toBe('borrador');
      expect(response.body.data.sucursalOrigen).toBe(testPlanillaData.sucursalOrigen);
      expect(response.body.data.remitos).toHaveLength(2);
      
      // Guardar el ID para tests posteriores
      createdPlanillaId = response.body.data.id;
    });

    it('debería fallar si falta campos obligatorios', async () => {
      const invalidData = {
        sucursalOrigen: 'Sucursal Central',
        // falta: fechaSalidaEstimada, camion, chofer
      };

      const response = await request(BASE_URL)
        .post('/api/planillas')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================================================
  // TEST 2: Listar planillas
  // =============================================================================
  describe('GET /api/planillas - Listar Planillas', () => {
    it('debería devolver todas las planillas', async () => {
      const response = await request(BASE_URL)
        .get('/api/planillas')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('count');
    });

    it('debería filtrar por estado', async () => {
      const response = await request(BASE_URL)
        .get('/api/planillas?estado=borrador')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verificar que todas las planillas devueltas sean estado 'borrador'
      response.body.data.forEach((planilla: any) => {
        expect(planilla.estado).toBe('borrador');
      });
    });
  });

  // =============================================================================
  // TEST 3: Obtener planilla por ID
  // =============================================================================
  describe('GET /api/planillas/:id - Obtener Planilla', () => {
    it('debería devolver una planilla específica con sus remitos', async () => {
      const response = await request(BASE_URL)
        .get(`/api/planillas/${createdPlanillaId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdPlanillaId);
      expect(response.body.data).toHaveProperty('remitos');
      expect(response.body.data.remitos).toHaveLength(2);
    });

    it('debería devolver 404 si la planilla no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(BASE_URL)
        .get(`/api/planillas/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('no encontrada');
    });
  });

  // =============================================================================
  // TEST 4: Confirmar inicio de viaje (borrador -> viaje)
  // =============================================================================
  describe('POST /api/planillas/:id/confirmar-viaje - Confirmar Viaje', () => {
    it('debería cambiar estado de borrador a viaje y registrar km de salida', async () => {
      const response = await request(BASE_URL)
        .post(`/api/planillas/${createdPlanillaId}/confirmar-viaje`)
        .send({ kmSalida: 50000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('viaje');
      expect(response.body.data.kmSalida).toBe(50000);
      expect(response.body.data.fechaSalidaEstimada).toBeDefined();
    });

    it('debería fallar si la planilla no está en estado borrador', async () => {
      // Ya está en estado 'viaje', entonces debería fallar si intentamos confirmar de nuevo
      const response = await request(BASE_URL)
        .post(`/api/planillas/${createdPlanillaId}/confirmar-viaje`)
        .send({ kmSalida: 50001 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================================================
  // TEST 5: Confirmar llegada (viaje -> control)
  // =============================================================================
  describe('POST /api/planillas/:id/confirmar-llegada - Confirmar Llegada', () => {
    it('debería cambiar estado de viaje a control y registrar km de llegada', async () => {
      const response = await request(BASE_URL)
        .post(`/api/planillas/${createdPlanillaId}/confirmar-llegada`)
        .send({ kmLlegada: 50200 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('control');
      expect(response.body.data.kmLlegada).toBe(50200);
      expect(response.body.data.fechaLlegadaEstimada).toBeDefined();
    });
  });

  // =============================================================================
  // TEST 6: Finalizar control (control -> completo/incompleto)
  // =============================================================================
  describe('POST /api/planillas/:id/finalizar-control - Finalizar Control', () => {
    it('debería actualizar remitos con datos de control (bultos recibidos, peso, dirección, whatsapp)', async () => {
      const remitosControl = [
        {
          id: 'remito-uuid-1', // El ID real se obtiene de la respuesta anterior
          bultosRecibidos: 5, //Coincide con los 5 declarados
          pesoTotal: 150.50,
          direccion: 'Calle Nueva 789',
          whatsapp: '3511112233'
        },
        {
          id: 'remito-uuid-2',
          bultosRecibidos: 2, // Diferencia: declaró 3, recibió 2
          pesoTotal: 80.25,
          direccion: 'Av. Nueva 012',
          whatsapp: '3514445566'
        }
      ];

      const response = await request(BASE_URL)
        .post(`/api/planillas/${createdPlanillaId}/finalizar-control`)
        .send({ remitos: remitosControl })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('incompleto'); // Porque hay diferencia de bultos
    });

    it('debería marcar como completo si todos los bultos coinciden', async () => {
      // Crear nueva planilla para test
      const nuevaPlanilla = await request(BASE_URL)
        .post('/api/planillas')
        .send({
          sucursalOrigen: 'Sucursal Norte',
          sucursalDestino: 'Sucursal Sur',
          fechaSalidaEstimada: new Date().toISOString(),
          fechaLlegadaEstimada: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          camion: 'DEF-456',
          chofer: 'Pedro García',
          remitos: [
            {
              remitente: 'Empresa X',
              numeroRemito: 'REM-003',
              destinatario: 'Cliente Y',
              bultos: 10,
              valorDeclarado: 2000,
              direccion: 'Calle Test 1',
              whatsapp: '3510001111'
            }
          ]
        });

      const planillaId = nuevaPlanilla.body.data.id;

      // Confirmar viaje
      await request(BASE_URL)
        .post(`/api/planillas/${planillaId}/confirmar-viaje`)
        .send({ kmSalida: 60000 });

      // Confirmar llegada
      await request(BASE_URL)
        .post(`/api/planillas/${planillaId}/confirmar-llegada`)
        .send({ kmLlegada: 60200 });

      // Finalizar control con bultos recibidos = bultos declarados
      const response = await request(BASE_URL)
        .post(`/api/planillas/${planillaId}/finalizar-control`)
        .send({
          remitos: [
            {
              id: nuevaPlanilla.body.data.remitos[0].id,
              bultosRecibidos: 10, // Coincide
              pesoTotal: 300.00,
              direccion: 'Calle Test 1',
              whatsapp: '3510001111'
            }
          ]
        });

      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('completo');
    });
  });

  // =============================================================================
  // TEST 7: Actualizar planilla
  // =============================================================================
  describe('PUT /api/planillas/:id - Actualizar Planilla', () => {
    it('debería actualizar los datos de la planilla', async () => {
      const response = await request(BASE_URL)
        .put(`/api/planillas/${createdPlanillaId}`)
        .send({
          comentarios: 'Comentarios de prueba actualizados',
          chofer: 'Carlos López'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comentarios).toBe('Comentarios de prueba actualizados');
      expect(response.body.data.chofer).toBe('Carlos López');
    });
  });

  // =============================================================================
  // TEST 8: Eliminar planilla
  // =============================================================================
  describe('DELETE /api/planillas/:id - Eliminar Planilla', () => {
    it('debería eliminar una planilla y sus remitos relacionados', async () => {
      const response = await request(BASE_URL)
        .delete(`/api/planillas/${createdPlanillaId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que ya no existe
      const verifyResponse = await request(BASE_URL)
        .get(`/api/planillas/${createdPlanillaId}`)
        .expect(404);

      expect(verifyResponse.body.message).toContain('no encontrada');
    });
  });
});