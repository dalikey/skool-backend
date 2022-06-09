import {MongoClient, ObjectId} from 'mongodb';
import loginBody from '../models/loginBody';
import {registrationInsert} from '../models/registrationBody';
import conf from 'dotenv';
import Logger from 'js-logger';
import app from "../index";
import {userBody} from "../models/userBody";
import {CustomerBody} from "../models/customerBody";
import {workshopInsert} from "../models/workshopBody";
import {WorkshopShiftBody} from "../models/workshopShiftBody";

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
const shifts: string = "shift";
const customer: string = "client";
const workshop: string = "workshop";
//Client
const client = new MongoClient(mongoDBUrl);
//Connection
let connection:any = null;

export const queryCommands = {
    //Connections
   async connectDB(){
     if(!connection){
         connection = await client.connect();
     }
     return connection;
   },
    //User collection
    async getUserCollection() {
        if (!connection) {
            connection = await client.connect();
        }
        return connection.db(skoolWorkshop).collection(user);
    },
    //Customer collection
    async getCustomerCollection(){
       if(!connection){
           connection = await client.connect();
       }
       return connection.db(skoolWorkshop).collection(customer);
    }
    ,
    //Shift collection
    async getShiftCollection(){
       connection = await this.connectDB();
       return connection.db(skoolWorkshop).collection(shifts);
    }
    ,
    //Workshop collection
    async getWorkshopCollection(){
        if(!connection){
            connection = await this.connectDB();
        }
        return connection.db(skoolWorkshop).collection(workshop);
    }
    ,

    //Database commands
    async getUser(id: ObjectId) {
        const projection = {password: 0};
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
        
    },
    async updateUser(userId: ObjectId, data: Object) {
        const collection = await this.getUserCollection();
        try {
            const query = await collection.findOneAndUpdate({"_id": userId}, {$set: data}, { projection: {password: 0}, returnDocument: "after"})
            return query.value;
        } catch (err) {
            Logger.error(err);
            return {error: "update_failure"}
        }
    },
    async deleteUser(userId: ObjectId) {
        const collection = await this.getUserCollection();
        try {
            const query = await collection.deleteOne({"_id": userId});
            Logger.info(query)
            if (query.deletedCount === 0) {
                return false;
            }
            return true
        } catch (err) {
            return false;
        }
    }
    ,
    async insertCustomer(customerData: CustomerBody){
       const collection = await this.getCustomerCollection();
       try {
           return await collection.insertOne(customerData);
       } catch (e) {
           return {error: "insert_error", message: "Insert of customer went wrong"};
       }
    }
    ,
    async deleteCustomer(customerId: string){
       const collect = await this.getCustomerCollection();
       const query = {_id: new ObjectId(customerId)};
       try{
           return await collect.deleteOne(query);
       }catch (e) {
           return null;
       }
    }
    ,
    async updateCustomer(customerId:string, customer: CustomerBody){
       const collection = await this.getCustomerCollection();
       const query = {_id: new ObjectId(customerId)};
       try {
           return await collection.replaceOne(query, customer);
        } catch (e) {
           return null;
        }
    }
    ,
    //TODO Improve queries with joins
    async getAllCustomers(){
        const collection = await this.getCustomerCollection();
        try {
            return await collection.find({}).toArray();
        } catch (e) {
            return null;
        }
    }
    ,
    async getOneCustomer(customerId:string){
        const collection = await this.getCustomerCollection();
        const query = {_id: customerId};
        try {
            return await collection.findOne(query);
        } catch (e) {
            return null;
        }
    }
    ,
    async insertOneWorkshopShift(workshopShift:WorkshopShiftBody){
        const collection = await this.getShiftCollection();
        try {
            return await collection.insertOne(workshopShift);
        }catch (e) {
            return null;
        }
    }
    ,
    async getAllShifts(){
       const collection = await this.getShiftCollection();
       try {
           return await collection.find({}).toArray();
       }catch (e){
           return null;
       }
    }
    ,
    async getOneShift(shiftId: string){
       const collection = await this.getShiftCollection();
       try {
           const filter = {_id: new ObjectId(shiftId)};
           return await collection.findOne(filter);
       }catch (e) {
           return null;
       }
    }
    ,
    async updateShift(shiftId:string, shift:any){
       const collection = await this.getShiftCollection();
       const query = {_id: new ObjectId(shiftId)};
       try {
           return await collection.replaceOne(query, shift);
       }catch (e) {
           return null;
       }
    }
    ,
    async deleteShift(shiftId: string){
       const collection = await this.getShiftCollection();
       const query = {_id:shiftId};
       try {
           return await collection.deleteOne(query);
       } catch (e) {
           return null;
       }

    }
    ,

    async enrollToShift(shiftId: string, enrollmentObject: any){
       try {
           const collection = await this.getShiftCollection();
           const pushQuery = {$push: {candidates: enrollmentObject}};
           return await collection.updateOne({_id: new ObjectId(shiftId)}, pushQuery);
       } catch (e){
           return null;
       }
    }
    ,
    async checkEnrollmentOfUser(shiftId: string, userId:string){
        try {
            const collection = await this.getShiftCollection();
            const filterEmbeddedObjectQuery = {userId: new ObjectId(userId), shiftId: new ObjectId(shiftId)};
            return await collection.findOne({_id: new ObjectId(shiftId), candidates: filterEmbeddedObjectQuery });
        } catch (e){
            return null;
        }
    },
    async createWorkshop(workshop:workshopInsert){
        const collection = await this.getWorkshopCollection();
        try {
            return await collection.insertOne(workshop);
        }catch (e){
            return null;
        }
    }
    ,
    async getAllWorkshops(){
        const collection = await this.getWorkshopCollection();
        try {
            return await collection.find({}).toArray();
        }catch (e){
            return null;
        }
    }

}
