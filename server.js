import express from 'express';
import cors from 'cors'
import bparser from 'body-parser'
import cparser from 'cookie-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import helmet from 'helmet'
import morgan from 'morgan'

import authRouter from './src/routes/auth/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT | 3000;

app.use(cors({origin:'*'}))
app.use(cparser())
app.use(bparser.json());
app.use(helmet())
app.use(morgan('dev'))

app.use('/api/auth',authRouter);

mongoose.connect(process.env.MONGO_STRING).then(()=>{
    app.listen(PORT,()=> console.log("Server is running !"));
}).catch((e)=>console.log('Error occured while connecting to Database ERROR: ',e))