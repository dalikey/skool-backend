import {MongoClient, ObjectId} from 'mongodb';
import loginBody from '../models/loginBody';
import {registrationInsert} from '../models/registrationBody';
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
const user: string = "user";
const shifts: string = "client";
const customer: string = "client";
//Client
const client = new MongoClient(mongoDBUrl);
//Connection
let connection:any = null;

export const queryCommands = {
   async getUserCollection() {
        if (!connection) {
            connection = await client.connect();
        }
        return connection.db(skoolWorkshop).collection(user);
    },
    async getCustomerCollection(){
       if(!connection){
           connection = await client.connect();
       }
       return connection.db(skoolWorkshop).collection(shifts);
    }

    ,
    async getUser(id: ObjectId) {
        const projection = {_id: 1, firstName: 1, lastName: 1, emailAddress: 1, role: 1, isActive:1};
        Logger.info(projection);

        try {
            const collection = await this.getUserCollection();
            const queryResult =  await collection.findOne({_id: id}, {projection});
            Logger.info(queryResult);
            return queryResult;
        } catch (err: any) {
            return {status: 500, error: err.message}
        }

    },

    async getAllUsers(filter: any) {
        const projection = {_id: 1, firstName: 1, lastName: 1, emailAddress: 1, role: 1, isActive:1};
        Logger.info(projection);

        try {
            const collection = await this.getUserCollection();
            const queryResult =  await collection.find(filter).project(projection).toArray();
            Logger.info(queryResult);
            return queryResult;
        } catch (err: any) {
            return {status: 500, error: err.message}
        }
    },

    async approveUser(id: ObjectId, approve: boolean) {
        try {
            const collection = await this.getUserCollection();
            const queryResult =  await collection.updateOne({_id: id}, {"$set": {isActive: approve}});
            return queryResult;
        } catch (err: any) {
            return {status: 500, error: err.message}
        }
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
            const projection = {_id: 1, emailAddress:1, firstName: 1, lastName: 1};
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
    async storeSecretKeyPR(emailAddress: string, token: string, secretKey:string){
       const collection = await this.getUserCollection();
       const filter = {emailAddress: emailAddress};
       const updateQuery  = {$set:{passwordResetToken: token, key: secretKey}};
       try {
            return await collection.updateOne(filter, updateQuery);
       } catch (err){
            return null;
       }
    }
    ,
    async selectTokenFromUser(token: string){
        const collection = await this.getUserCollection();
        const projection = {key: 1};
        try {
            return await collection.findOne({passwordResetToken: token}, {projection});
        } catch (err){
            return null;
        }
    }
    ,
    async removeSecretKey(userId:string){
        const collection = await this.getUserCollection();
        const filter = {_id: new ObjectId(userId)};
        const updateQuery  = {$unset:{passwordResetToken: "", key: ""}};
        try {
            return await collection.updateOne(filter, updateQuery);
        } catch (e){
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
    ,
    async insertCustomer(customerData: any){
       const collection = await this.getCustomerCollection();
       try {
           const query = await collection.insertOne(customerData);
       } catch (e) {
           return{error: "insert_error", message: "Insert of customer went wrong"};
       }
    }
    ,
    async deleteCustomer(customerId: string){
       const collect = await this.getCustomerCollection();
       const query = {_id: new ObjectId(customerId)};
       try{
           return await collect.deleteOne(query);
       }catch (e) {

       }
    }
    ,
    async updateCustomer(customerId:string, customer: any){
       const collection = await this.getCustomerCollection();
       const query = {_id: new ObjectId(customerId)};
       try {
           return await collection.replaceOne(query, customer);
        } catch (e) {

        }
    }
    ,
    async getAllCustomers(){
        const collection = await this.getCustomerCollection();
        try {
            return await collection.find({}).toArray();
        } catch (e) {

        }
    }
    ,
    async getOneCustomer(customerId:string){
        const collection = await this.getCustomerCollection();
        const query = {_id: customerId};
        try {
            return await collection.findOne(query);
        } catch (e) {

        }
    }
}
