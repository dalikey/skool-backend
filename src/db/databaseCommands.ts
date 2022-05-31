import { MongoClient } from 'mongodb';
import loginBody from '../models/loginBody';
import  { registrationInsert } from '../models/registrationBody';
import conf from 'dotenv';
import Logger from 'js-logger';
conf.config();

//MongoDb url
const mongoDBUrl = process.env.DB_URL;
if(!mongoDBUrl){
    throw new Error('No url present');
}
//Database
const skoolWorkshop: string = "skooldevelop";
//Collection
const user: string = "user"
//Client
const client = new MongoClient(mongoDBUrl);
//Connection
let connection:any = null;

export const queryCommands = {



    //Closes connection
    closeDB:()=>{
        connection.close();
        console.log('Connection been cut off');
        connection = null;
    }
    ,
   async getUserCollection() {
        if (!connection) {
            connection = await client.connect();
        }
        const coll = connection.db(skoolWorkshop).collection(user);
        return coll;
    },
    //Retrieve user based on login body
    async loginUser(loginData: loginBody) {
        try {
            let login = loginData;
            const collection = await this.getUserCollection();
            const queryResult = collection.findOne({login});
            return queryResult;
        } catch (error) {
            return {status: 500, message: error};
        }
    }
    ,
    async registerUser(registrationData: registrationInsert) {
        const collection = await this.getUserCollection();
        try {
            const query = await collection.insertOne(registrationData);
            Logger.info(query);
            return true;
        } catch (err) {
            return {error: "duplicate_user", message: err}
        }
        
    }
}
