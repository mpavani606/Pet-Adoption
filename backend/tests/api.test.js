import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let mongo;

async function register(overrides = {}) {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Test User', email: `user-${Date.now()}-${Math.random()}@example.com`, password: 'secret123', role: 'adopter', ...overrides
  });
  return response.body;
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  ({ default: app } = await import('../server.js'));
});

afterEach(async () => { await mongoose.connection.db.dropDatabase(); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

describe('authentication', () => {
  test('registers with a hashed password, logs in, and returns /me', async () => {
    const registration = await register({ name: 'Ava Adopter' });
    expect(registration.token).toBeDefined();
    expect(registration.user.password).toBeUndefined();

    const login = await request(app).post('/api/auth/login').send({ email: registration.user.email, password: 'secret123' });
    expect(login.status).toBe(200);

    const profile = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user.email).toBe(registration.user.email);
  });

  test('rejects missing and invalid bearer tokens', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid')).status).toBe(401);
  });
});

describe('approval workflow and role permissions', () => {
  test('blocks adopter actions, scopes ownership, and approves a request', async () => {
    const shelter = await register({ name: 'Kindred Shelter', role: 'shelter' });
    const adopter = await register({ name: 'Ari Adopter' });
    const secondAdopter = await register({ name: 'Sam Adopter' });

    const created = await request(app).post('/api/pets').set('Authorization', `Bearer ${shelter.token}`).send({
      name: 'Maple', type: 'Dog', breed: 'Beagle mix', age: 2, gender: 'Female', description: 'A gentle, playful dog looking for a home.'
    });
    expect(created.status).toBe(201);
    const petId = created.body._id;

    expect((await request(app).put(`/api/pets/${petId}`).set('Authorization', `Bearer ${adopter.token}`).send({ name: 'Nope' })).status).toBe(403);
    const firstRequest = await request(app).post('/api/requests').set('Authorization', `Bearer ${adopter.token}`).send({ pet: petId, message: 'I have a calm home and lots of time for Maple.' });
    const secondRequest = await request(app).post('/api/requests').set('Authorization', `Bearer ${secondAdopter.token}`).send({ pet: petId, message: 'Maple would have a lovely home with us.' });
    expect(firstRequest.status).toBe(201);
    expect(secondRequest.status).toBe(400);

    expect((await request(app).patch(`/api/requests/${firstRequest.body._id}/approve`).set('Authorization', `Bearer ${adopter.token}`)).status).toBe(403);
    const approved = await request(app).patch(`/api/requests/${firstRequest.body._id}/approve`).set('Authorization', `Bearer ${shelter.token}`);
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe('approved');

    const pet = await request(app).get(`/api/pets/${petId}`);
    expect(pet.body.status).toBe('adopted');
  });
});
