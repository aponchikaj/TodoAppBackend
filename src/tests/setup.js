import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.JWT_SECRET = 'Lazare2010';
process.env.NODE_ENV = 'test';

let mongo;

export async function connect() {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
}

export async function clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

export async function disconnect() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
}