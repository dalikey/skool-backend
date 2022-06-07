import { MongoClient, ObjectId } from 'mongodb';
import { workshopInsert } from '../models/workshopBody';
import conf from 'dotenv';
import Logger from 'js-logger';
conf.config();

//MongoDb url
const mongoDBUrl = process.env.DB_URL;
if (!mongoDBUrl) {
    throw new Error('No url present');
}
//Database
const skoolWorkshop = process.env.MONGODB;
//Collection
const workshop: string = 'workshop';
//Client
const client = new MongoClient(mongoDBUrl);
//Connection
let connection: any = null;

export const queryCommands = {
    async getWorkshopCollection() {
        if (!connection) {
            connection = await client.connect();
        }
        return connection.db(skoolWorkshop).collection(workshop);
    },

    async getWorkshop(id: ObjectId) {
        const projection = {
            _id: 1,
            name: 1,
            city: 1,
            street: 1,
            description: 1,
            // date
            maxParticipants: 1,
            imageUrl: 1,
            userId: 1,
            isActive: 1,
        };
        Logger.info(projection);

        try {
            const collection = await this.getWorkshopCollection();
            const queryResult = await collection.findOne(
                { _id: id },
                { projection }
            );
            Logger.info(queryResult);
            return queryResult;
        } catch (err: any) {
            return { status: 500, error: err.message };
        }
    },

    async getAllWorkshops(filter: any) {
        const projection = {
            _id: 1,
            name: 1,
            city: 1,
            street: 1,
            description: 1,
            // date
            maxParticipants: 1,
            imageUrl: 1,
            userId: 1,
            isActive: 1,
        };
        Logger.info(projection);

        try {
            const collection = await this.getWorkshopCollection();
            const queryResult = await collection
                .find(filter)
                .project(projection)
                .toArray();
            Logger.info(queryResult);
            return queryResult;
        } catch (err: any) {
            return { status: 500, error: err.message };
        }
    },

    async approveWorkshop(id: ObjectId, approve: boolean) {
        try {
            const collection = await this.getWorkshopCollection();
            const queryResult = await collection.updateOne(
                { _id: id },
                { $set: { isActive: approve } }
            );
            return queryResult;
        } catch (err: any) {
            return { status: 500, error: err.message };
        }
    },

    async registerWorkshop(workshopData: workshopInsert) {
        const collection = await this.getWorkshopCollection();
        try {
            const query = await collection.insertOne(workshopData);
            Logger.info(query);
            return { error: 0 };
        } catch (err) {
            return { error: 'duplicate_workshop', message: err };
        }
    },
};
