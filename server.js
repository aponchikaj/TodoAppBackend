import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_STRING).then(() => 
    app.listen(PORT,()=>{console.log('Server is running! ! !!!')})
).catch((e) =>console.log('DB connection error:', e));