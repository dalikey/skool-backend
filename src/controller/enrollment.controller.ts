import {queryCommands} from "../db/databaseCommands";
import assert from "assert";
import {WorkshopShiftBody} from "../models/workshopShiftBody";
import {ObjectId} from "mongodb";
import time, {DateTime, Duration} from 'luxon';
import nodemailer, {Transporter} from "nodemailer";
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
        if(currentDate < result.availableUntil){
            next();
        } else {
            res.status(401).json({error: "time_issue", message: "shift is not available for enrollment."})
        }
    }
    ,
    async checkAmountOfParticipants(req: any, res: any, next:any){
        const shiftId = req.params.shiftId;
        const result = await queryCommands.getOneShift(shiftId);
        if(result.participants.length < result.maximumParticipants){
            next();
        } else{
            res.status(401).json({error: "limit_reached", message: "maximum amount of participants reached."});
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
        const userId = res.params.userId;
        const shiftId = req.params.shiftId;
        const result = await queryCommands.checkParticipationOfUser(shiftId, userId);
        if(result){
            res.status(400).json({error: "already_participated", message: "user has already been enrolled to this shift"});
        } else{
            next();
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
            res.status(401).json({message: "Failure enrollment"});
        }
    }
    ,
    async putStatusOnDone(req: any, res: any){
        const userId = res.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Rejected";
        await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
        res.status(201).json({message: "User has completed the shift"});
    },
    async cancelParticipation(req: any, res:any){
        const userId = res.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Rejected";
        try {
            //Delete userId from participationlist.
            await queryCommands.cancelParticipation(shiftId, userId);
            //Change status in candidatelist to rejected.
            await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
            res.status(201).json({message: "Participation has been canceled."});
        } catch (e){

        }
    },
    async confirmEnrollmentToShift(req:any, res:any){
        const userId = res.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Current"
        try {
            //Adds participant to participant list.
            const enroll = await queryCommands.confirmParticipation(shiftId, userId);
            //Changes status in candidateslist.
            const changeStatus = await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
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
            res.status(201).json({message: "User has been confirmed to be part of this shift."})
        }catch (e){
            res.status(401).json({message: "Failure enrollment"});
        }
    },
    async rejectEnrollment(req:any, res:any){
        const userId = res.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Rejected";
        try {
            //Changes status in candidateslist.
            await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
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
            res.status(201).json({message: "User has been rejected from the workshop"})
        }catch (e){
            res.status(401).json({message: "Failed database action"});
        }
    },
    async removeEnrollment(req:any, res:any){
        //Initialize variables
        //Remove participant
        //Remove candidate

        res.status(201).json({message: "User has been rejected from the workshop"})
    }
}

export default controller;