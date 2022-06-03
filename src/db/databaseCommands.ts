import {MongoClient, ObjectId} from 'mongodb';
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
const skoolWorkshop = process.env.MONGODB;
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
        return connection.db(skoolWorkshop).collection(user);
    },
    //Retrieve user based on login body
    async loginUser(loginData: loginBody) {
        const projection = {_id: 1, firstName: 1, lastName: 1, emailAddress: 1, password: 1, role: 1, isActive:1};
        try {
            let emailAddress = loginData.emailAddress;
            const collection = await this.getUserCollection();
            return collection.findOne({emailAddress}, {projection});
        } catch (error:any) {
            return {error: "login_failure", message: error.message};
        }
    }
    ,
    async retrieveEmail(emailAddress: string){
        try {
            const projection = {_id: 1, emailAddress:1, lastName: 1};
            const collection = await this.getUserCollection();
            return collection.findOne({emailAddress}, {projection});
        }catch (e) {
            return undefined;
        }
    },
    //
    async updatePassword(userId: string, newPassword: string){
        const collection = await this.getUserCollection();
        try {
            const query = {$set: {password: newPassword}};
            return await collection.updateOne({_id: new ObjectId(userId) }, query);
        } catch (e) {
            return null;
        }
    }
    ,
    async registerUser(registrationData: registrationInsert) {
        const collection = await this.getUserCollection();
        try {
            const query = await collection.insertOne(registrationData);
            Logger.info(query);
            return {error: 0};
        } catch (err) {
            return {error: "duplicate_user", message: err}
        }
        
    }
}
