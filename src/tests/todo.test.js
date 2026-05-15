import request from 'supertest';
import app from '../app.js';
import {connect,clearDatabase,disconnect} from './setup.js';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await disconnect());

const userA = { username: 'userA', email: 'a@example.com', password: 'Test@1234' };
const userB = { username: 'userB', email: 'b@example.com', password: 'Test@1234' };

const validTodo = {
    title: 'Buy groceries',
    description: 'Milk and eggs',
    status: 'To Do',
    priority: 'medium',
};

async function registerAndLogin(userData) {
    await request(app).post('/api/auth/register').send(userData);
    const res = await request(app).post('/api/auth/login').send({ user: userData.email, password: userData.password });
    return res.headers['set-cookie'];
}

async function createTodo(cookie, overrides = {}) {
    return request(app).post('/api/todos').set('Cookie', cookie).send({ ...validTodo, ...overrides });
}

async function getTodoId(cookie, overrides = {}) {
    const res = await createTodo(cookie, overrides);
    return res.body.Message._id;
}

describe('POST /api/todos', () => {

    let cookie;
    beforeEach(async () => { cookie = await registerAndLogin(userA); });

    it('creates a todo successfully', async () => {
        const res = await createTodo(cookie);
        expect(res.body.Success).toBe(true);
        expect(res.body.Message).toHaveProperty('todoTitle', validTodo.title.trim());
    });

    it('auto-assigns the todo to the logged-in user', async () => {
        const res = await createTodo(cookie);
        expect(res.body.Message).toHaveProperty('userID');
    });

    it('defaults status to "To Do" when omitted', async () => {
        const res = await createTodo(cookie, { status: undefined });
        expect(res.body.Message.status).toBe('To Do');
    });

    it('defaults priority to "medium" when omitted', async () => {
        const res = await createTodo(cookie, { priority: undefined });
        expect(res.body.Message.priority).toBe('medium');
    });

    it('rejects missing title', async () => {
        const res = await createTodo(cookie, { title: '' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/title/i);
    });

    it('rejects title over 200 chars', async () => {
        const res = await createTodo(cookie, { title: 'a'.repeat(201) });
        expect(res.body.Success).toBe(false);
    });

    it('rejects invalid status', async () => {
        const res = await createTodo(cookie, { status: 'INVALID' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/status/i);
    });

    it('rejects invalid priority', async () => {
        const res = await createTodo(cookie, { priority: 'urgent' });
        expect(res.body.Success).toBe(false);
    });

    it('rejects a due date in the past', async () => {
        const res = await createTodo(cookie, { dueDate: '2000-01-01' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/past/i);
    });

    it('accepts a valid future due date', async () => {
        const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const res = await createTodo(cookie, { dueDate: future });
        expect(res.body.Success).toBe(true);
    });

    it('rejects unauthenticated request', async () => {
        const res = await request(app).post('/api/todos').send(validTodo);
        expect(res.body.Success).toBe(false);
    });

});

describe('GET /api/todos', () => {

    let cookie;
    beforeEach(async () => {
        cookie = await registerAndLogin(userA);
        await createTodo(cookie, { title: 'Alpha', status: 'To Do',      priority: 'high'   });
        await createTodo(cookie, { title: 'Beta',  status: 'In Progress', priority: 'low'    });
        await createTodo(cookie, { title: 'Gamma', status: 'Done',        priority: 'medium' });
    });

    it('returns only the logged-in user\'s todos', async () => {
        const cookieB = await registerAndLogin(userB);
        await createTodo(cookieB, { title: 'User B todo' });

        const res = await request(app).get('/api/todos').set('Cookie', cookie);
        expect(res.body.Success).toBe(true);
        expect(res.body.Message).toHaveLength(3);
    });

    it('filters by status', async () => {
        const res = await request(app)
        .get('/api/todos?status=To Do')
        .set('Cookie', cookie);
        expect(res.body.Message.every(t => t.status === 'To Do')).toBe(true);
    });

    it('filters by priority', async () => {
        const res = await request(app)
        .get('/api/todos?priority=high')
        .set('Cookie', cookie);
        expect(res.body.Message.every(t => t.priority === 'high')).toBe(true);
    });

    it('searches by title', async () => {
        const res = await request(app)
        .get('/api/todos?search=alpha')
        .set('Cookie', cookie);
        expect(res.body.Message).toHaveLength(1);
        expect(res.body.Message[0].todoTitle).toBe('Alpha');
    });

    it('returns pagination metadata', async () => {
        const res = await request(app).get('/api/todos?page=1&limit=2').set('Cookie', cookie);
        expect(res.body.Pagination).toMatchObject({
            total: 3,
            totalPages: 2,
            currentPage: 1,
            hasNextPage: true,
            hasPrevPage: false,
        });
    });

    it('returns empty array when user has no todos', async () => {
        const cookieB = await registerAndLogin(userB);
        const res = await request(app).get('/api/todos').set('Cookie', cookieB);
        expect(res.body.Success).toBe(true);
        expect(res.body.Message).toHaveLength(0);
    });

    it('rejects unauthenticated request', async () => {
        const res = await request(app).get('/api/todos');
        expect(res.body.Success).toBe(false);
    });

});

describe('GET /api/todos/:id', () => {

    let cookie, todoId;
    beforeEach(async () => {
        cookie = await registerAndLogin(userA);
        todoId = await getTodoId(cookie);
    });

    it('returns the correct todo for its owner', async () => {
        const res = await request(app).get(`/api/todos/${todoId}`).set('Cookie', cookie);
        expect(res.body.Success).toBe(true);
        expect(res.body.Message._id).toBe(todoId);
    });

    it('returns 404 for a non-existent id', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app).get(`/api/todos/${fakeId}`).set('Cookie', cookie);
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/not found/i);
    });

    it('rejects a malformed id', async () => {
        const res = await request(app).get('/api/todos/not-an-id').set('Cookie', cookie);
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/invalid/i);
    });

    it('does NOT return user A\'s todo to user B', async () => {
        const cookieB = await registerAndLogin(userB);
        const res = await request(app).get(`/api/todos/${todoId}`).set('Cookie', cookieB);
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/not found/i);
    });

});


describe('PUT /api/todos/:id', () => {

    let cookie, todoId;
    beforeEach(async () => {
        cookie = await registerAndLogin(userA);
        todoId = await getTodoId(cookie);
    });

    it('updates a todo successfully', async () => {
        const res = await request(app).put(`/api/todos/${todoId}`).set('Cookie', cookie).send({ title: 'Updated title', status: 'Done', priority: 'high' });
        expect(res.body.Success).toBe(true);
    });

    it('rejects empty title on update', async () => {
        const res = await request(app).put(`/api/todos/${todoId}`).set('Cookie', cookie).send({ title: '' });
        expect(res.body.Success).toBe(false);
    });

    it('rejects invalid status on update', async () => {
        const res = await request(app).put(`/api/todos/${todoId}`).set('Cookie', cookie).send({ title: 'Fine title', status: 'Nope' });
        expect(res.body.Success).toBe(false);
    });

    it('does NOT let user B update user A\'s todo', async () => {
        const cookieB = await registerAndLogin(userB);
        const res = await request(app).put(`/api/todos/${todoId}`).set('Cookie', cookieB).send({ title: 'Hijacked', status: 'Done', priority: 'low' });
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/not found/i);
    });

    it('rejects unauthenticated request', async () => {
        const res = await request(app).put(`/api/todos/${todoId}`).send({ title: 'Hijacked', status: 'Done', priority: 'low' });
        expect(res.body.Success).toBe(false);
    });

})

describe('DELETE /api/todos/:id', () => {
    let cookie, todoId
    beforeEach(async () => {
        cookie = await registerAndLogin(userA);
        todoId = await getTodoId(cookie);
    });

    it('deletes a todo successfully', async () => {
        const res = await request(app).delete(`/api/todos/${todoId}`).set('Cookie', cookie);
        expect(res.body.Success).toBe(true);
    });

    it('todo is gone after deletion', async () => {
        await request(app).delete(`/api/todos/${todoId}`).set('Cookie', cookie);
        const res = await request(app).get(`/api/todos/${todoId}`).set('Cookie', cookie);
        expect(res.body.Success).toBe(false);
    });

    it('returns not found for already-deleted todo', async () => {
        await request(app).delete(`/api/todos/${todoId}`).set('Cookie', cookie);
        const res = await request(app).delete(`/api/todos/${todoId}`).set('Cookie', cookie);
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/not found/i);
    });

    it('does NOT let user B delete user A\'s todo', async () => {
        const cookieB = await registerAndLogin(userB);
        const res = await request(app).delete(`/api/todos/${todoId}`).set('Cookie', cookieB);
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/not found/i);
    });

    it('rejects a malformed id', async () => {
        const res = await request(app).delete('/api/todos/bad-id').set('Cookie', cookie);
        expect(res.body.Success).toBe(false);
        expect(res.body.Message).toMatch(/invalid/i);
    });

    it('rejects unauthenticated request', async () => {
        const res = await request(app).delete(`/api/todos/${todoId}`);
        expect(res.body.Success).toBe(false);
    });

});