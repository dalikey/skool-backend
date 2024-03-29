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
import logger from "js-logger";
import {insertTemplateMessage} from "../models/templateMessageBody";

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
const templateMessage: string = "template_message"
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
    },
    //Template message collection
    async getTempMessageCollecton(){
       connection = await this.connectDB();
       return connection.db(skoolWorkshop).collection(templateMessage);
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
        const aggr = [
            {
                '$lookup':{
                    'from': 'workshop',
                    'localField': 'workshopPreferences',
                    'foreignField': '_id',
                    'as': 'workshopPreferences'
                }
            }, {
                $project:projection
            },
            {
                "$match": {
                    "_id": id
                }
            }]
        try {
            const collection = await this.getUserCollection();
            const newQueryResult =await collection.aggregate(aggr).toArray();
            return newQueryResult[0];
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
    //Login
    async loginUser(loginData: loginBody) {
        const projection = {_id: 1, firstName: 1, lastName: 1, emailAddress: 1, password: 1, role: 1, isActive:1};
        try {
            let emailAddress = loginData.emailAddress;
            const collection = await this.getUserCollection();
            return collection.findOne({emailAddress}, {projection});
        } catch (error:any) {
            return {error: "login_failure", message: error.message};
        }
    },
    async retrieveEmail(emailAddress: string){
        try {
            const projection = {_id: 1, emailAddress:1, firstName: 1, lastName: 1};
            const collection = await this.getUserCollection();
            return collection.findOne({emailAddress}, {projection});
        }catch (e) {
            return undefined;
        }
    },
    //User and password update
    async updatePassword(userId: string, newPassword: string){
        const collection = await this.getUserCollection();
        try {
            const query = {$set: {password: newPassword}};
            return await collection.updateOne({_id: new ObjectId(userId) }, query);
        } catch (e) {
            return null;
        }
    },
    async storeSecretKeyPR(emailAddress: string, token: string, secretKey:string){
       const collection = await this.getUserCollection();
       const filter = {emailAddress: emailAddress};
       const updateQuery  = {$set:{passwordResetToken: token, key: secretKey}};
       try {
            return await collection.updateOne(filter, updateQuery);
       } catch (err){
            return null;
       }
    },
    async selectTokenFromUser(token: string){
        const collection = await this.getUserCollection();
        const projection = {key: 1};
        try {
            return await collection.findOne({passwordResetToken: token}, {projection});
        } catch (err){
            return null;
        }
    },
    async removeSecretKey(userId:string){
        const collection = await this.getUserCollection();
        const filter = {_id: new ObjectId(userId)};
        const updateQuery  = {$unset:{passwordResetToken: "", key: ""}};
        try {
            return await collection.updateOne(filter, updateQuery);
        } catch (e){
            return null;
        }
    },
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
            return query.deletedCount !== 0;
        } catch (err) {
            return false;
        }
    },
    //Customers
    async insertCustomer(customerData: CustomerBody){
       const collection = await this.getCustomerCollection();
       try {
           return await collection.insertOne(customerData);
       } catch (e) {
           return {error: "insert_error", message: "Insert of customer went wrong"};
       }
    },
    async deleteCustomer(customerId: string){
       const collect = await this.getCustomerCollection();
       const query = {_id: new ObjectId(customerId)};
       try{
           return await collect.deleteOne(query);
       }catch (e) {
           return null;
       }
    },
    async updateCustomer(customerId:string, customer: CustomerBody){
       try {
           const collection = await this.getCustomerCollection();
           const query = { _id: new ObjectId(customerId)};
           return await collection.findOneAndUpdate(query, {$set: customer}, { returnDocument: 'after' });
        } catch (e) {
           return null;
        }
    },
    async getAllCustomers(){
        const collection = await this.getCustomerCollection();
        try {
            return await collection.find({}).toArray();
        } catch (e) {
            return null;
        }
    },
    async getOneCustomer(customerId:string){
        const collection = await this.getCustomerCollection();
        const query = {_id: new ObjectId(customerId)};
        try {
            return await collection.findOne(query);
        } catch (e) {
            return null;
        }
    },
    //Shifts
    async insertOneWorkshopShift(workshopShift:WorkshopShiftBody){
        const collection = await this.getShiftCollection();
        try {
            return await collection.insertOne(workshopShift);
        }catch (e) {
            return null;
        }
    },
    async getAllShifts(){
        logger.info("Aggregation setup");
        const agg = [
            {
                '$lookup': {
                    'from': 'client',
                    'localField': 'clientId',
                    'foreignField': '_id',
                    'as': 'client'
                }
            }, {
                '$lookup': {
                    'from': 'workshop',
                    'localField': 'workshopId',
                    'foreignField': '_id',
                    'as': 'workshop'
                }
            }, {
                '$lookup': {
                    'from': 'user',
                    'localField': 'participants.userId',
                    'foreignField': '_id',
                    'as': 'participantUsers'
                }
            },{
                '$lookup': {
                    'from': 'user',
                    'localField': 'candidates.userId',
                    'foreignField': '_id',
                    'as': 'candidateUsers'
                }
            },
            {
                '$project': {
                    'candidateUsers.password': 0,
                    'candidateUsers.passwordResetToken': 0,
                    'participantUsers.password': 0,
                    'participantUsers.passwordResetToken': 0,
                }
            }
        ];
        logger.info("Aggregation setup completed");
        try {
            logger.info("Retrieval from database started");
            const collection = await this.getShiftCollection();
            logger.info("Aggregation setup");
            return await collection.aggregate(agg).toArray();
        }catch (e){
            logger.info("Something went wrong with retrieval");
            logger.info(e);
            return null;
        }
    },
    async getAllEnrolledShifts(user_id: ObjectId){
       logger.info("Aggregation setup");
       const agg = [
            {
                '$match': {
                    "$or": [
                        {"participants.userId": user_id},
                        {"candidates.userId": user_id}
                        ]
                }
            },
            {
                '$lookup': {
                    'from': 'client',
                    'localField': 'clientId',
                    'foreignField': '_id',
                    'as': 'client'
                }
            }, {
                '$lookup': {
                    'from': 'workshop',
                    'localField': 'workshopId',
                    'foreignField': '_id',
                    'as': 'workshop'
                }
            }, {
                '$lookup': {
                    'from': 'user',
                    'localField': 'participants.userId',
                    'foreignField': '_id',
                    'as': 'participantUsers'
                }
            },{
                '$lookup': {
                    'from': 'user',
                    'localField': 'candidates.userId',
                    'foreignField': '_id',
                    'as': 'candidateUsers'
                }
            },
           {
               '$project': {
                   'candidateUsers.password': 0,
                   'candidateUsers.passwordResetToken': 0,
                   'participantUsers.password': 0,
                   'participantUsers.passwordResetToken': 0,
               }
           }
        ];
        logger.info("Aggregation setup completed");
       try {
           logger.info("Retrieval from database started");
           const collection = await this.getShiftCollection();
           logger.info("Aggregation setup");
           return await collection.aggregate(agg).toArray();
       }catch (e){
           logger.info("Something went wrong with retrieval");
           logger.info(e);
           return null;
       }
    },
    async getOneShift(shiftId: string){

       try {
           const collection = await this.getShiftCollection();
           const filter = {_id: new ObjectId(shiftId)};
           return await collection.findOne(filter);
       }catch (e) {
           return e;
       }
    },
    async updateShift(shiftId:string, shift:any){
       try {
           const collection = await this.getShiftCollection();
           const query = {_id: new ObjectId(shiftId)};
           const updateQuery = {$set:{workshopId: shift.workshopId, clientId: shift.clientId, location: shift.location, date: shift.date, availableUntil: shift.availableUntil,
               maximumParticipants: shift.maximumParticipants,
               extraInfo: shift.extraInfo,
               level: shift.level,
               targetAudience: shift.targetAudience,
               timestamps: shift.timestamps,
               tariff: shift.rate,
               total_Amount: shift.totalTariff,
               formOfTime: shift.formOfTime }};
           return await collection.findOneAndUpdate(query, updateQuery);
       }catch (e) {
           return null;
       }
    },
    async deleteShift(shiftId: string){
       const collection = await this.getShiftCollection();
       const query = {_id: new ObjectId(shiftId)};
       try {
           return await collection.deleteOne(query);
       } catch (e) {
           return e;
       }

    },
    //Enrollments and participation
    async changeStatusEnrollmentParticipant(shiftId:string, userId:string, status: string){
        try {
            const collection = await this.getShiftCollection();
            const changeStatusQuery = {$set: {"candidates.$.status": status}};
            const projection = {_id: 1, candidates: 1};
            const query = {_id: new ObjectId(shiftId),"candidates.userId": new ObjectId(userId)};
            return await collection.findOneAndUpdate(query, changeStatusQuery, { returnDocument: 'after' });
        } catch (e){
            return null;
        }
    },
    //Enrollments and participation
    async changeStatusInParticipation(shiftId:string, userId:string, status: string){
        try {
            const collection = await this.getShiftCollection();
            const changeStatusQuery = {$set: {"participants.$.status": status}};
            const query = {_id: new ObjectId(shiftId),"participants.userId": new ObjectId(userId)};
            return await collection.findOneAndUpdate(query, changeStatusQuery, { returnDocument: 'after' });
        } catch (e){
            return null;
        }
    },
    async enrollToShift(shiftId: string, enrollmentObject: any){
       try {
           const collection = await this.getShiftCollection();
           const pushQuery = {$push: {candidates: enrollmentObject}};
           return await collection.findOneAndUpdate({_id: new ObjectId(shiftId)}, pushQuery, { returnDocument: 'after' });
       } catch (e){
           return null;
       }
    },
    async confirmParticipation(shiftId: string, userCandidateObject: any){
        try {
            const collection = await this.getShiftCollection();
            const pushQuery = {$push: {participants: userCandidateObject}};
            return await collection.findOneAndUpdate({_id: new ObjectId(shiftId)}, pushQuery, { returnDocument: 'after' });
        } catch (e){
            return null;
        }
    },
    async cancelParticipation(shiftId:string, userId:string){
      try {
          const collection = await this.getShiftCollection();
          const deleteQuery = {$pull: {participants: { userId: new ObjectId(userId)} }};
          return await collection.findOneAndUpdate({_id: new ObjectId(shiftId)}, deleteQuery, { returnDocument: 'after' });
      } catch (e) {
          return null;
      }
    },
    async checkEnrollmentOfUser(shiftId: string, userId:string){
        try {
            const collection = await this.getShiftCollection();
            return await collection.findOne({_id: new ObjectId(shiftId), 'candidates.userId': new ObjectId(userId) });
        } catch (e){
            return null;
        }
    },
    async deleteUnknownParticipant(shiftId: string, ExternalStatus:string, ExternalUserBody: any){
        try {
            const collection = await this.getShiftCollection();
            const newDelete = {$pull: {participants: {External_Status: ExternalStatus, emailAddress: ExternalUserBody.emailAddress} } } ;
            const ll = { 'participants.emailAddress': ExternalUserBody.emailAddress };
            const deleteQuery = {$pull: {participants: { emailAddress: ExternalUserBody.emailAddress }} };
            return await collection.updateOne({_id: new ObjectId(shiftId)}, deleteQuery);
        } catch (e) {
            return null;
        }
    },
    async checkParticipationOfUser(shiftId: string, userId:string){
        try {
            const collection = await this.getShiftCollection();
            const filterEmbeddedObjectQuery = { userId: new ObjectId(userId)};
            return await collection.findOne({_id: new ObjectId(shiftId), 'participants.userId': new ObjectId(userId)});
        } catch (e){
            logger.info(e);
            return null;
        }
    },
    async enrollUnknownUser(unknownUserObject: any, shiftId: string){
       try {
           const collection = await this.getShiftCollection();
           const pushQuery = {$push: {participants: unknownUserObject}};
           return await collection.updateOne({_id: new ObjectId(shiftId)},pushQuery)
       }catch (e) {
           return null;
       }
    },
    async deleteEnrollment(shiftId: string, userId:string){
       try {
           const collection = await this.getShiftCollection();
           return await collection.updateOne({_id: new ObjectId(shiftId)}, {$pull: {candidates: {userId: new ObjectId(userId)}}});
       }catch (e) {
           return null;
       }
    },
    async getCandidatesList(shiftId: string){
       try {
           const col = await this.getShiftCollection();
           const old = await col.findOne({_id: new ObjectId(shiftId)});
           let obj = old.candidates;
           return obj;
       }catch (e) {
            throw e;
       }
    },
    async insertInvitationToRequestArray(shiftId: string,invitation: any){
       const query = { $push : {invitations: invitation}};
       const filter = { _id: new ObjectId(shiftId)};
       const returnFilter = {}
       try {
         const collection = await this.getShiftCollection();
         return await collection.findOneAndUpdate(filter, query, { returnDocument: 'after' });
       } catch (e) {

       }
    },
    async pullOutInvitation(shiftId: string, userId: string){
       try {
           const query = { $pull: {invitations: {userId: new ObjectId(userId)}}};
           const filter = {_id: new ObjectId(shiftId)};
           const collection = await queryCommands.getShiftCollection();
           return await collection.findOneAndUpdate(filter, query);
       }catch (e) {
           return null
       }
    },
    async checkDuplicationInvitation(shiftId: string ,emailAddress:string){
       try {
           const query ={_id: new ObjectId(shiftId), "invitations.emailAddress": emailAddress};
           const collect = await this.getShiftCollection();
           return await collect.findOne(query);
       }catch (e){
           return e;
       }
    },
    //Workshops
    async createWorkshop(workshop:workshopInsert){
        const collection = await this.getWorkshopCollection();
        try {
            return await collection.insertOne(workshop);
        }catch (e){
            return null;
        }
    },
    async getAllWorkshops(filter: any){
        try {
            const collection = await this.getWorkshopCollection();
            return await collection.find(filter).toArray();
        }catch (e){
            return e;
        }
    },
    async updateWorkshop(workshopId:string, workshop: workshopInsert){
        try {
            const collection = await this.getWorkshopCollection();
            const query = { _id: new ObjectId(workshopId)};
            return await collection.findOneAndUpdate(query, {$set: workshop});
         } catch (e) {
            return null;
         }
     },
    async deleteWorkshop(workshopId: string){
       try {
           const collect = await this.getWorkshopCollection();
           return await collect.deleteOne({_id: new ObjectId(workshopId)});
       }catch (e) {
           return null;
       }
    },
    async getOneWorkshop(workshopId:string){
      try {
          const collect = await this.getWorkshopCollection();
          return await collect.findOne({_id: new ObjectId(workshopId)});
      } catch (e) {
          return e;
      }
    },
    async changeStatusWorkshop(workshopId:string, status:boolean){},
    //Template message// Trigger values are unique
    async insertTemplateMessage(templateMessage: insertTemplateMessage, triggerValue:string){
       try {
           const collection = await this.getTempMessageCollecton();
           return await collection.replaceOne({trigger: triggerValue} ,templateMessage, {upsert: true} );
       } catch (e) {
           return e;
       }
    }
    ,
    async updateTemplate(newTemplateMessage: insertTemplateMessage, templateId: string){
        try {
            const collection = await this.getTempMessageCollecton();
            return await collection.findOneAndReplace({_id: new ObjectId(templateId)} ,newTemplateMessage, { returnDocument: 'after' });
        } catch (e) {
            return null;
        }
    }
    ,
    async deleteTemplate(templateId:string){
        try {
            const collection = await this.getTempMessageCollecton();
            return await collection.deleteOne({_id: new ObjectId(templateId)});
        } catch (e) {
            return e;
        }
    },
    async getAllTemplates(){
       try {
           const collection = await this.getTempMessageCollecton();
           return await collection.find({}).toArray();
       }catch (e) {
           return e;
       }
    }
    ,
    async getOneTemplate(triggerValue:string){
       try {
           const collect = await this.getTempMessageCollecton();
           return await collect.findOne({trigger: triggerValue});
       } catch (e) {
           return e;
       }
    }
}
