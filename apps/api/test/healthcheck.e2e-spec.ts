import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './test-helpers';

describe('Healthcheck API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
      // Give time for cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  describe('GET /api/healthcheck', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/healthcheck')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });
});
