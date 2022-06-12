import {queryCommands} from "../db/databaseCommands";
import assert from "assert";
import {WorkshopShiftBody} from "../models/workshopShiftBody";
import {ObjectId} from "mongodb";
import time, {DateTime, Duration} from 'luxon';
import nodemailer, {Transporter} from "nodemailer";
import dotEnv from 'dotenv'
dotEnv.config();
let transporter: Transporter;

if (process.env.SMTP_SERVER) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVER,
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USERNAME, // generated ethereal user
            pass: process.env.SMTP_PASSWORD, // generated ethereal password
        },
    });
}

const controller = {
    async checkExistenceShift(req: any, res: any, next:any){
        const shiftId = req.params.shiftId;
        const result = await queryCommands.getOneShift(shiftId);
        console.log(result);
        if(result){
            next();
        } else{
            res.status(404).json({error: "non_existent", message: "shift does not exist"});
        }

    } ,
    async checkEnrollDate(req:any, res: any, next:any){
        const shiftId = req.params.shiftId;
        const result = await queryCommands.getOneShift(shiftId);
        const currentDate = DateTime.now();
        if(currentDate <= result.availableUntil){
            next();
        } else {
            res.status(400).json({error: "time_issue", message: "shift is not available for enrollment."})
        }
    }
    ,
    async checkAmountOfParticipants(req: any, res: any, next:any){
        const shiftId = req.params.shiftId;
        const result = await queryCommands.getOneShift(shiftId);
        if(result.participants.length < result.maximumParticipants){
            next();
        } else{
            res.status(400).json({error: "limit_reached", message: "maximum amount of participants reached."});
        }
    },
    async checkEnrollmentExistence(req:any, res:any, next:any){
        const userId = res.locals.decodedToken;
        const shiftId = req.params.shiftId;
        const result = await queryCommands.checkEnrollmentOfUser(shiftId, userId);
        if(result){
            res.status(400).json({error: "already_enrolled", message: "user has already been enrolled"});
        } else{
            next();
        }
    }
    ,
    async checkParticipationDuplication(req:any, res:any, next:any){
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        try {
            const result = await queryCommands.checkParticipationOfUser(shiftId, userId);
            if(result){
                res.status(400).json({error: "already_participated", message: "user has already been enrolled to this shift"});
            } else{
                next();
            }
        }catch (e){
            res.status(400).json({error: "data_error", message: "retrieval has failed"});
        }

    }
    ,
    async enrollToShift(req: any, res: any){
        const userId = res.locals.decodedToken;
        const WshiftId = req.params.shiftId;
        const enrollmentObject = { userId: new ObjectId(userId), shiftId: new ObjectId(WshiftId), enrollDate: DateTime.now(), status: "Pending", motivation: req.body.motivation};
        try {
            const enroll = await queryCommands.enrollToShift(WshiftId, enrollmentObject);
            res.status(201).json({message: "user has send enrollment."})
        }catch (e){
            res.status(400).json({message: "Failure enrollment"});
        }
    }
    ,
    async putStatusOnDone(req: any, res: any){
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Rejected";
        await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
        res.status(201).json({message: "User has completed the shift"});
    },
    async cancelParticipation(req: any, res:any){
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Rejected";
        try {
            //needs to check if userId is external or not
            //If userId is external, it will delete unknown user
            if(userId == "Extern"){
                const externalBody = req.body;
                try {
                    assert(externalBody.emailAddress);
                    await queryCommands.deleteUnknownParticipant(shiftId, userId, externalBody);
                    res.status(201).json({message: "Participation unknown user has been removed."});
                }catch (e) {
                    res.status(400).json({error: "deletion_unknown_user_failed", message: "unknown user failed to delete"});
                }

            } else{
                //Delete userId from participationlist.
                await queryCommands.cancelParticipation(shiftId, userId);
                //Change status in candidatelist to rejected.
                const resultset = await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
                res.status(201).json({message: "Participation has been canceled.", result: resultset.value});
            }
        } catch (e){
            res.status(400).json({error: "participation_change_error", message: "Problems with change in participants"});
        }
    },
    async confirmEnrollmentToShift(req:any, res:any){
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Current"
        try {
            //Changes status in candidateslist.
            const changeStatus = await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
            //Adds participant to participant list.
            const enroll = await queryCommands.confirmParticipation(shiftId, userId);
            // Sends confirmation mail.
            if (process.env.SMTP_SERVER) {
                const registration = await queryCommands.getUser(new ObjectId(userId));
                const info = await transporter.sendMail({
                    from: process.env.SMTP_USERNAME,
                    to: registration.emailAddress,
                    subject: `Gebruiker ${registration.firstName} ${registration.lastName} is definitief ingeschreven.`,
                    text: `Beste ${registration.firstName} ${registration.lastName},\nU bent officieel ingeschreven voor de workshop.\n
                    Wij hopen u spoedig te zien op uw dienst.`
                });
            }
            res.status(201).json({message: "User has been confirmed to be part of this shift.", result: enroll.value})
        }catch (e){
            res.status(400).json({message: "Failure enrollment"});
        }
    },
    async rejectEnrollment(req:any, res:any){
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Rejected";
        try {
            //Changes status in candidateslist.
            const enrollmentStatus = await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
            // Sends confirmation mail.
            if (process.env.SMTP_SERVER) {
                const registration = await queryCommands.getUser(new ObjectId(userId));
                const info = await transporter.sendMail({
                    from: process.env.SMTP_USERNAME,
                    to: registration.emailAddress,
                    subject: `Gebruiker ${registration.firstName} ${registration.lastName}, de inschrijving is afgekeurd.`,
                    text: `Beste ${registration.firstName} ${registration.lastName},\nU bent officieel geweigerd voor deze workshop.\n
                    Wij hopen u spoedig te zien in de toekomst.`
                });
            }
            res.status(201).json({message: "User has been rejected from the workshop", result: enrollmentStatus.value.candidates})
        }catch (e){
            res.status(400).json({message: "Failed database action"});
        }
    },
    async removeEnrollment(req:any, res:any){
        //Initialize variables
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        //Remove participant
        await queryCommands.cancelParticipation(shiftId, userId);
        //Remove candidate
        await queryCommands.deleteEnrollment(shiftId, userId);
        res.status(201).json({message: "User has been rejected from the workshop"})
    }
    ,
    async addUnknownUserToParticipantList(req:any, res:any){
        //Extern_Status, firstname, lastName, emailAddress, telefoon, tarief, formOfTime
        const unknownUser = req.body;
        const shiftId = req.params.shiftId;
        //Checks input-validation of unknown user
        try {
           assert(typeof unknownUser.firstName == 'string');
           assert(typeof unknownUser.lastName == 'string');
           assert(typeof unknownUser.emailAddress == 'string');
           assert(typeof unknownUser.phoneNumber == 'string');
           assert(typeof unknownUser.bankNumber == 'string');
        } catch (e) {
            return res.status(400).json({error: "input_error", message: "Missing inputfields"});
        }
        //Assigns Extern_Id
        //Future: Adding bankaccount number
        //Add date
        unknownUser.Extern_Status = "Extern";
        unknownUser.date = DateTime.now();
        try {
            //Database command
            await queryCommands.enrollUnknownUser(unknownUser, shiftId);
            res.status(201).json({message: "Unknown user successfully registered in shift."});
        }catch (e){
            res.status(400).json({error: "database_error", message: "Enrollment of unknown user went wrong."});
        }

    }
}

export default controller;