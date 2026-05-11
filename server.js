import express from 'express';
import cors from 'cors'
import bparser from 'body-parser'
import cparser from 'cookie-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose';

dotenv.config()

const app = express()
const PORT = process.env.PORT | 3000;

app.use(cors({origin:'*'}))
app.use(cparser())
app.use(bparser.json());



mongoose.connect(process.env.MONGO_STRING).then(()=>{
    app.listen(PORT);
}).catch((e)=>console.log('Error occured while connecting to Database ERROR: ',e))