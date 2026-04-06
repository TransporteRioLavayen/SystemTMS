// =============================================================================
// TEST: HOJA DE RUTA - CONFIRMAR COMPLETADA
// =============================================================================
// Tests para verificar el endpoint de confirmar hoja de ruta como completada

import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('API - Hoja de Ruta: Confirmar Completada', () => {
  let testHojaId: string;
  let testRemitoId: string;

  // Setup: Crear hoja de ruta con remitos para testing
  beforeAll(async () => {
    // Crear una hoja de ruta
    const createResponse = await request(BASE_URL)
      .post('/api/hojas-ruta')
      .send({
        unidad: 'TEST-001',
        chofer: 'Chofer Test',
        cargas: []
      });

    testHojaId = createResponse.body.data.id;

    // Agregar remitos de prueba
    const cargaResponse = await request(BASE_URL)
      .post(`/api/hojas-ruta/${testHojaId}/agregar-carga`)
      .send({
        remitoId: 'REM-TEST-001',
        cliente: 'Cliente Prueba 1',
        direccion: 'Calle Prueba 1',
        bultos: 2
      });

    testRemitoId = 'REM-TEST-001';

    // Iniciar el turno
    await request(BASE_URL)
      .post(`/api/hojas-ruta/${testHojaId}/iniciar-turno`)
      .send({ kmSalida: 10000 });
  });

  afterAll(async () => {
    // Limpieza: eliminar hoja de prueba
    if (testHojaId) {
      await request(BASE_URL)
        .delete(`/api/hojas-ruta/${testHojaId}`);
    }
  });

  describe('PATCH /api/hojas-ruta/:id/confirmar-completada', () => {
    it('debería fallar si la hoja no está en estado "En reparto"', async () => {
      // Crear nueva hoja en estado "Lista para salir"
      const newHoja = await request(BASE_URL)
        .post('/api/hojas-ruta')
        .send({
          unidad: 'TEST-002',
          chofer: 'Chofer Test 2'
        });

      const response = await request(BASE_URL)
        .patch(`/api/hojas-ruta/${newHoja.body.data.id}/confirmar-completada`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('En reparto');

      // Limpiar
      await request(BASE_URL)
        .delete(`/api/hojas-ruta/${newHoja.body.data.id}`);
    });

    it('debería fallar si hay remitos pendientes (sin entregar)', async () => {
      // Ya tenemos una hoja con remitos, pero ninguno entregado
      const response = await request(BASE_URL)
        .patch(`/api/hojas-ruta/${testHojaId}/confirmar-completada`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('entregadas');
    });

    it('debería cambiar estado a "Completada" cuando todos los remitos están entregados', async () => {
      // Primero, marcar todos los remitos como entregados
      await request(BASE_URL)
        .patch(`/api/hojas-ruta/${testHojaId}/remitos/${testRemitoId}/estado`)
        .send({ estado: 'Entregado' });

      // Ahora intentar confirmar como completada
      const response = await request(BASE_URL)
        .patch(`/api/hojas-ruta/${testHojaId}/confirmar-completada`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('Completada');
    });

    it('debería permitir confirmar cuando hay remitos rechazados', async () => {
      // Crear nueva hoja para test de rechazos
      const newHoja = await request(BASE_URL)
        .post('/api/hojas-ruta')
        .send({
          unidad: 'TEST-003',
          chofer: 'Chofer Test 3',
          cargas: []
        });

      const hojaId = newHoja.body.data.id;

      // Agregar remito
      await request(BASE_URL)
        .post(`/api/hojas-ruta/${hojaId}/agregar-carga`)
        .send({
          remitoId: 'REM-TEST-002',
          cliente: 'Cliente Prueba 2',
          direccion: 'Calle Prueba 2',
          bultos: 1
        });

      // Iniciar turno
      await request(BASE_URL)
        .post(`/api/hojas-ruta/${hojaId}/iniciar-turno`)
        .send({ kmSalida: 20000 });

      // Marcar como rechazado
      await request(BASE_URL)
        .patch(`/api/hojas-ruta/${hojaId}/remitos/REM-TEST-002/estado`)
        .send({ estado: 'Rechazado' });

      // Confirmar como completada (rechazado cuenta como completado)
      const response = await request(BASE_URL)
        .patch(`/api/hojas-ruta/${hojaId}/confirmar-completada`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.estado).toBe('Completada');

      // Limpiar
      await request(BASE_URL)
        .delete(`/api/hojas-ruta/${hojaId}`);
    });
  });
});
