// =============================================================================
// TESTS DE INTEGRACIÓN - API HOJAS DE RUTA
// =============================================================================
// Tests para verificar el flujo completo de gestión de hojas de ruta
// IMPORTANTE: Estos tests asumen que el servidor ya está corriendo en localhost:3001

import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

let testHojaId: string;
let testPlanillaId: string;

describe('API - Módulo de Gestión de Hojas de Ruta', () => {
  
  // =============================================================================
  // TEST 1: Crear una hoja de ruta vacía para pruebas
  // =============================================================================
  describe('POST /api/hojas-ruta - Crear Hoja de Ruta', () => {
    it('debería crear una hoja de ruta en estado "Lista para salir"', async () => {
      const response = await request(BASE_URL)
        .post('/api/hojas-ruta')
        .send({
          unidad: 'ABC-123',
          chofer: 'Juan Pérez',
          acompanante: 'Carlos López',
          cargas: []
        })
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.estado).toBe('Lista para salir');
      expect(response.body.data.unidad).toBe('ABC-123');
      expect(response.body.data.chofer).toBe('Juan Pérez');
      
      testHojaId = response.body.data.id;
    });

    it('debería fallar si faltan campos obligatorios', async () => {
      const invalidData = {
        unidad: 'ABC-123',
        // falta: chofer
      };

      const response = await request(BASE_URL)
        .post('/api/hojas-ruta')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================================================
  // TEST 2: Listar hojas de ruta
  // =============================================================================
  describe('GET /api/hojas-ruta - Listar Hojas de Ruta', () => {
    it('debería devolver todas las hojas de ruta', async () => {
      const response = await request(BASE_URL)
        .get('/api/hojas-ruta')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('debería filtrar por estado', async () => {
      const response = await request(BASE_URL)
        .get('/api/hojas-ruta?estado=Lista para salir')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((hoja: any) => {
        expect(hoja.estado).toBe('Lista para salir');
      });
    });
  });

  // =============================================================================
  // TEST 3: Obtener hoja de ruta por ID
  // =============================================================================
  describe('GET /api/hojas-ruta/:id - Obtener Hoja de Ruta', () => {
    it('debería devolver una hoja de ruta específica', async () => {
      const response = await request(BASE_URL)
        .get(`/api/hojas-ruta/${testHojaId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testHojaId);
    });

    it('debería devolver 404 si la hoja no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(BASE_URL)
        .get(`/api/hojas-ruta/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================================================
  // TEST 4: Actualizar hoja de ruta
  // =============================================================================
  describe('PUT /api/hojas-ruta/:id - Actualizar Hoja de Ruta', () => {
    it('debería actualizar los datos de la hoja de ruta', async () => {
      const response = await request(BASE_URL)
        .put(`/api/hojas-ruta/${testHojaId}`)
        .send({
          chofer: 'Pedro García',
          acompanante: 'Jorge López'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chofer).toBe('Pedro García');
    });
  });

  // =============================================================================
  // TEST 5: Iniciar turno (Lista para salir -> En reparto)
  // =============================================================================
  describe('POST /api/hojas-ruta/:id/iniciar-turno - Iniciar Turno', () => {
    it('debería cambiar estado a "En reparto" y registrar km de salida', async () => {
      const response = await request(BASE_URL)
        .post(`/api/hojas-ruta/${testHojaId}/iniciar-turno`)
        .send({ kmSalida: 50000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('En reparto');
      expect(response.body.data.kmSalida).toBe(50000);
    });
  });

  // =============================================================================
  // TEST 6: Asignar remitos a la hoja de ruta
  // =============================================================================
  describe('POST /api/hojas-ruta/:id/agregar-carga - Agregar Carga', () => {
    it('debería agregar un remito a la hoja de ruta', async () => {
      const response = await request(BASE_URL)
        .post(`/api/hojas-ruta/${testHojaId}/agregar-carga`)
        .send({
          remitoId: 'remito-test-1',
          cliente: 'Cliente Test',
          direccion: 'Calle Falsa 123',
          whatsapp: '3511234567',
          bultos: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cargas).toHaveLength(1);
      expect(response.body.data.cargas[0].remitoId).toBe('remito-test-1');
    });
  });

  // =============================================================================
  // TEST 7: Actualizar estado de un remito en la hoja
  // =============================================================================
  describe('PATCH /api/hojas-ruta/:id/remitos/:remitoId/estado - Actualizar Estado Remito', () => {
    it('debería actualizar el estado de un remito (Entregado)', async () => {
      const response = await request(BASE_URL)
        .patch(`/api/hojas-ruta/${testHojaId}/remitos/remito-test-1/estado`)
        .send({ estado: 'Entregado' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const remitoActualizado = response.body.data.cargas.find((c: any) => c.remitoId === 'remito-test-1');
      expect(remitoActualizado.estado).toBe('Entregado');
    });

    it('debería actualizar el estado a Rechazado', async () => {
      const response = await request(BASE_URL)
        .patch(`/api/hojas-ruta/${testHojaId}/remitos/remito-test-1/estado`)
        .send({ estado: 'Rechazado' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const remitoActualizado = response.body.data.cargas.find((c: any) => c.remitoId === 'remito-test-1');
      expect(remitoActualizado.estado).toBe('Rechazado');
    });
  });

  // =============================================================================
  // TEST 8: Terminar turno (En reparto -> Unidad libre)
  // =============================================================================
  describe('POST /api/hojas-ruta/:id/terminar-turno - Terminar Turno', () => {
    it('debería cambiar estado a "Unidad libre" y registrar km de llegada', async () => {
      const response = await request(BASE_URL)
        .post(`/api/hojas-ruta/${testHojaId}/terminar-turno`)
        .send({ kmLlegada: 50200 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('Unidad libre');
      expect(response.body.data.kmLlegada).toBe(50200);
    });
  });

  // =============================================================================
  // TEST 9: Eliminar hoja de ruta
  // =============================================================================
  describe('DELETE /api/hojas-ruta/:id - Eliminar Hoja de Ruta', () => {
    it('debería eliminar una hoja de ruta', async () => {
      const response = await request(BASE_URL)
        .delete(`/api/hojas-ruta/${testHojaId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que ya no existe
      const verifyResponse = await request(BASE_URL)
        .get(`/api/hojas-ruta/${testHojaId}`)
        .expect(404);
    });
  });
});