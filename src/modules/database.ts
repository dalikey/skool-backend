import Logger from 'js-logger';
import { MongoClient } from 'mongodb';

const mongoURL = process.env.MONGOURL;
if (!mongoURL) {
    throw new Error("Database url is missing!");
}
const client = new MongoClient(mongoURL);

export default function getDatabase() {
    client.connect();
    const db = client.db('skooldevelop');
    Logger.info('Connected to MongoDB')
    return db;
}

