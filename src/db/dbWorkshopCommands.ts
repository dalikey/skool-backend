import { MongoClient, ObjectId } from 'mongodb';
import loginBody from '../models/loginBody';
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
            firstName: 1,
            lastName: 1,
            emailAddress: 1,
            role: 1,
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
            firstName: 1,
            lastName: 1,
            emailAddress: 1,
            role: 1,
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

    //Retrieve workshop based on login body
    async loginWorkshop(loginData: loginBody) {
        const projection = {
            _id: 1,
            firstName: 1,
            lastName: 1,
            emailAddress: 1,
            password: 1,
            role: 1,
            isActive: 1,
        };
        try {
            let emailAddress = loginData.emailAddress;
            const collection = await this.getWorkshopCollection();
            return collection.findOne({ emailAddress }, { projection });
        } catch (error: any) {
            return { error: 'login_failure', message: error.message };
        }
    },
    async retrieveEmail(emailAddress: string) {
        try {
            const projection = {
                _id: 1,
                emailAddress: 1,
                firstName: 1,
                lastName: 1,
            };
            const collection = await this.getWorkshopCollection();
            return collection.findOne({ emailAddress }, { projection });
        } catch (e) {
            return undefined;
        }
    },
    //
    async updatePassword(workshopId: string, newPassword: string) {
        const collection = await this.getWorkshopCollection();
        try {
            const query = { $set: { password: newPassword } };
            return await collection.updateOne(
                { _id: new ObjectId(workshopId) },
                query
            );
        } catch (e) {
            return null;
        }
    },
    async storeSecretKeyPR(
        emailAddress: string,
        token: string,
        secretKey: string
    ) {
        const collection = await this.getWorkshopCollection();
        const filter = { emailAddress: emailAddress };
        const updateQuery = {
            $set: { passwordResetToken: token, key: secretKey },
        };
        try {
            return await collection.updateOne(filter, updateQuery);
        } catch (err) {
            return null;
        }
    },
    async selectTokenFromWorkshop(token: string) {
        const collection = await this.getWorkshopCollection();
        const projection = { key: 1 };
        try {
            return await collection.findOne(
                { passwordResetToken: token },
                { projection }
            );
        } catch (err) {
            return null;
        }
    },
    async removeSecretKey(workshopId: string) {
        const collection = await this.getWorkshopCollection();
        const filter = { _id: new ObjectId(workshopId) };
        const updateQuery = { $unset: { passwordResetToken: '', key: '' } };
        try {
            return await collection.updateOne(filter, updateQuery);
        } catch (e) {
            return null;
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
