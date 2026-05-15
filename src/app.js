import express from 'express';
import cors from 'cors';
import bparser from 'body-parser';
import cparser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import authRouter from './routes/auth/auth.js';
import todoRouter from './routes/todos/todos.js';
import userRouter from './routes/user/user.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(cparser());
app.use(bparser.json());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/auth', authRouter);
app.use('/api', todoRouter);
app.use('/api', userRouter);

export default app;