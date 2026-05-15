import request from 'supertest';
import app from '../app.js';
import { connect, clearDatabase, disconnect } from './setup.js';

beforeAll(async () =>await connect());
afterEach(async ()=> await clearDatabase());
afterAll(async () =>await disconnect());

const validUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test@1234',
};

async function registerUser(overrides = {}) {
    return request(app).post('/api/auth/register').send({ ...validUser,...overrides })
}

async function loginUser(credentials = {}) {
    return request(app).post('/api/auth/login').send({ user: validUser.email, password: validUser.password, ...credentials });
}

async function getAuthCookie() {
    await registerUser();
    const res = await loginUser();
    return res.headers['set-cookie'];
}

describe('POST /api/auth/register', () => {

    it('registers a new user successfully', async () => {
        const res = await registerUser();
        expect(res.body.Success).toBe(true);
    });

    it('sets httpOnly userToken cookie on register', async () => {
        const res = await registerUser();
        const cookie = res.headers['set-cookie']?.[0] || '';
        expect(cookie).toMatch(/userToken=/);
        expect(cookie).toMatch(/HttpOnly/i);
    });

    it('rejects duplicate username', async () => {
        await registerUser();
        const res = await registerUser({ email: 'other@example.com' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/username/i);
    });

    it('rejects duplicate email', async () => {
        await registerUser();
        const res = await registerUser({ username: 'otheruser' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/email/i);
    });

    it('rejects invalid username (too short)', async () => {
        const res = await registerUser({ username: 'ab' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/username/i);
    });

    it('rejects username with special characters', async () => {
        const res = await registerUser({ username: 'bad user!' });
        expect(res.body.Success).toBe(false);
    });

    it('rejects weak password (no uppercase)', async () => {
        const res = await registerUser({ password: 'test@1234' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/password/i);
    });

    it('rejects weak password (no special char)', async () => {
        const res = await registerUser({ password: 'Test12345' });
        expect(res.body.Success).toBe(false);
    });

    it('rejects malformed email', async () => {
        const res = await registerUser({ email: 'notanemail' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/email/i);
    });

    it('rejects missing fields', async () => {
        const res = await request(app).post('/api/auth/register').send({});
        expect(res.body.Success).toBe(false);
    });

    it('does not return password in response', async () => {
        const res = await registerUser();
        const body = JSON.stringify(res.body);
        expect(body).not.toMatch(/password/i);
    });

});

describe('POST /api/auth/login', () => {
    beforeEach(async () => await registerUser());
    it('logs in with email successfully', async () => {
        const res = await loginUser({ user: validUser.email });
        expect(res.body.Success).toBe(true);
    });

    it('logs in with username successfully', async () => {
        const res = await loginUser({ user: validUser.username });
        expect(res.body.Success).toBe(true);
    });

    it('sets userToken cookie on login', async () => {
        const res = await loginUser();
        expect(res.headers['set-cookie']?.[0]).toMatch(/userToken=/);
    });

    it('rejects wrong password', async () => {
        const res = await loginUser({ password: 'Wrong@9999' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/invalid credentials/i);
    });

    it('rejects unknown email', async () => {
        const res = await loginUser({ user: 'nobody@example.com' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/invalid credentials/i);
    });

    it('rejects missing credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.body.Success).toBe(false);
    });

    it('does not reveal whether email or username was wrong', async () => {
        const emailRes  = await loginUser({ user: 'ghost@example.com' });
        const wrongPass = await loginUser({ password: 'Wrong@9999' });
        expect(emailRes.body.Message).toBe(wrongPass.body.Message);
    })
});

describe('POST /api/auth/logout', () => {

    it('clears the cookie and returns success', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
        expect(res.body.Success).toBe(true);
        const setCookie = res.headers['set-cookie']?.[0] || '';
        expect(setCookie).toMatch(/userToken=;|userToken=$/);
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.body.Success).toBe(false);
    });

});

describe('GET /api/auth/me', () => {
    it('returns the logged-in user without password', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
        expect(res.body.Success).toBe(true);
        expect(res.body.Message).toHaveProperty('username', validUser.username);
        expect(res.body.Message).toHaveProperty('email', validUser.email);
        expect(res.body.Message).not.toHaveProperty('password');
    });

    it('rejects unauthenticated request', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.body.Success).toBe(false);
    })
});