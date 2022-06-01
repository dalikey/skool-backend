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
        try {
            let emailAddress = loginData.emailAddress;
            const collection = await this.getUserCollection();
            const queryResult = collection.findOne({emailAddress});
            return queryResult;
        } catch (error:any) {
            return {status:500, error: error.message};
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
    ,
    async activateUser(){
        const collection = await this.getUserCollection();
        try{
            const user = await collection.updateOne({emailAddress: "dummy@outlook.com"}, {$set: {isActive: "true"}});
            Logger.info(user);
        } catch(error:any) {
        return {status:500, error: error.message};
        }
    } 
    ,
    async deleteUser(){
        try{
            const collection = await this.getUserCollection();
            const userDeletion = await collection.deleteOne({emailAddress: "dummy@outlook.com"});
            Logger.info(userDeletion);
        } catch(error:any) {
            return {status:500, error: error.message};
        }
    }

}
