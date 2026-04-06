// =============================================================================
// TEST: API CHOFER - ENDPOINTS
// =============================================================================
// Tests para verificar los endpoints de chofer en la API

import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('API - Módulo de Choferes', () => {
  let testChoferId: string;
  const testChoferDni = '99TEST999';

  // =============================================================================
  // TEST 1: Crear chofer
  // =============================================================================
  describe('POST /api/choferes - Crear Chofer', () => {
    it('debería crear un chofer válido', async () => {
      const response = await request(BASE_URL)
        .post('/api/choferes')
        .send({
          nombre: 'Chofer de Prueba',
          dni: testChoferDni,
          licencia: 'CD-999999',
          vencimientoLicencia: '2027-12-31',
          telefono: '351-9999999'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nombre).toBe('Chofer de Prueba');
      expect(response.body.data.dni).toBe(testChoferDni);
      expect(response.body.data.estado).toBe('DISPONIBLE');

      testChoferId = response.body.data.id;
    });

    it('debería fallar si el DNI ya existe', async () => {
      const response = await request(BASE_URL)
        .post('/api/choferes')
        .send({
          nombre: 'Otro Chofer',
          dni: testChoferDni, // Mismo DNI
          licencia: 'CD-888888',
          vencimientoLicencia: '2027-12-31',
          telefono: '351-8888888'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debería fallar si faltan campos obligatorios', async () => {
      const response = await request(BASE_URL)
        .post('/api/choferes')
        .send({
          nombre: 'Chofer Incompleto'
          // faltan: dni, licencia, vencimientoLicencia
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================================================
  // TEST 2: Listar choferes
  // =============================================================================
  describe('GET /api/choferes - Listar Choferes', () => {
    it('debería devolver todos los choferes', async () => {
      const response = await request(BASE_URL)
        .get('/api/choferes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('debería incluir el chofer creado en el listado', async () => {
      const response = await request(BASE_URL)
        .get('/api/choferes')
        .expect(200);

      const chofer = response.body.data.find((c: any) => c.dni === testChoferDni);
      expect(chofer).toBeDefined();
      expect(chofer.nombre).toBe('Chofer de Prueba');
    });
  });

  // =============================================================================
  // TEST 3: Obtener chofer por ID
  // =============================================================================
  describe('GET /api/choferes/:id - Obtener Chofer por ID', () => {
    it('debería devolver un chofer específico', async () => {
      const response = await request(BASE_URL)
        .get(`/api/choferes/${testChoferId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testChoferId);
      expect(response.body.data.dni).toBe(testChoferDni);
    });

    it('debería devolver 404 si el chofer no existe', async () => {
      const response = await request(BASE_URL)
        .get('/api/choferes/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================================================
  // TEST 4: Actualizar chofer
  // =============================================================================
  describe('PUT /api/choferes/:id - Actualizar Chofer', () => {
    it('debería actualizar los datos del chofer', async () => {
      const response = await request(BASE_URL)
        .put(`/api/choferes/${testChoferId}`)
        .send({
          nombre: 'Chofer Actualizado',
          telefono: '351-7777777'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe('Chofer Actualizado');
      expect(response.body.data.telefono).toBe('351-7777777');
    });

    it('debería actualizar el estado del chofer', async () => {
      const response = await request(BASE_URL)
        .put(`/api/choferes/${testChoferId}`)
        .send({
          estado: 'EN_RUTA'
        })
        .expect(200);

      expect(response.body.data.estado).toBe('EN_RUTA');
    });
  });

  // =============================================================================
  // TEST 5: Eliminar chofer
  // =============================================================================
  describe('DELETE /api/choferes/:id - Eliminar Chofer', () => {
    it('debería eliminar un chofer', async () => {
      // Primero crear un chofer para eliminar
      const createResponse = await request(BASE_URL)
        .post('/api/choferes')
        .send({
          nombre: 'Chofer Para Eliminar',
          dni: '98TEST998',
          licencia: 'CD-998888',
          vencimientoLicencia: '2027-12-31',
          telefono: '351-9988999'
        });

      const choferId = createResponse.body.data.id;

      const response = await request(BASE_URL)
        .delete(`/api/choferes/${choferId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que ya no existe
      const verifyResponse = await request(BASE_URL)
        .get(`/api/choferes/${choferId}`)
        .expect(404);
    });
  });

  // =============================================================================
  // Cleanup
  // =============================================================================
  afterAll(async () => {
    if (testChoferId) {
      await request(BASE_URL)
        .delete(`/api/choferes/${testChoferId}`);
    }
  });
});
