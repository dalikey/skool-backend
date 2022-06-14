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
        const status = "Done";
        await queryCommands.changeStatusInParticipation(shiftId, userId, status);
        res.status(201).json({message: "User has completed the shift"});
    },
    async cancelParticipation(req: any, res:any){
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        const status = "Rejected";
        try {
            //Delete userId from participationlist.
            await queryCommands.cancelParticipation(shiftId, userId);
            //Change status in candidatelist to rejected.
            res.status(201).json({message: "Participation has been canceled."});
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
            //Gets right object
            const listCandidates = await queryCommands.getCandidatesList(shiftId);
            //Filters users
            let user = listCandidates.filter((candidates: { userId: any; }) => candidates.userId == userId);
            //Removes candidate from candidates list.
            const removeCandidate = await queryCommands.deleteEnrollment(shiftId, userId);
            //Adds participant to participant list. - need to be changed
            const enroll = await queryCommands.confirmParticipation(shiftId, user[0]);
            // Sends confirmation mail.
            // if (process.env.SMTP_SERVER) {
            //     const registration = await queryCommands.getUser(new ObjectId(userId));
            //     const info = await transporter.sendMail({
            //         from: process.env.SMTP_USERNAME,
            //         to: registration.emailAddress,
            //         subject: `Gebruiker ${registration.firstName} ${registration.lastName} is definitief ingeschreven.`,
            //         text: `Beste ${registration.firstName} ${registration.lastName},\nU bent officieel ingeschreven voor de workshop.\n
            //         Wij hopen u spoedig te zien op uw dienst.`
            //     });
            // }
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
            // if (process.env.SMTP_SERVER) {
            //     const registration = await queryCommands.getUser(new ObjectId(userId));
            //     const info = await transporter.sendMail({
            //         from: process.env.SMTP_USERNAME,
            //         to: registration.emailAddress,
            //         subject: `Gebruiker ${registration.firstName} ${registration.lastName}, de inschrijving is afgekeurd.`,
            //         text: `Beste ${registration.firstName} ${registration.lastName},\nU bent officieel geweigerd voor deze workshop.\n
            //         Wij hopen u spoedig te zien in de toekomst.`
            //     });
            // }
            res.status(201).json({message: "User has been rejected from the workshop", result: enrollmentStatus.value.candidates})
        }catch (e){
            res.status(400).json({message: "Failed database action"});
        }
    },
    async removeEnrollment(req:any, res:any){
        //Initialize variables
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        try {
            //Remove participant
            await queryCommands.cancelParticipation(shiftId, userId);
            if (process.env.SMTP_SERVER) {
                const registration = await queryCommands.getUser(new ObjectId(userId));
                const info = await transporter.sendMail({
                    from: process.env.SMTP_USERNAME,
                    to: registration.emailAddress,
                    subject: `Gebruiker ${registration.firstName} ${registration.lastName}, de inschrijving is verwijderd.`,
                    text: `Beste ${registration.firstName} ${registration.lastName},\nU bent officieel afgemeld voor deze workshop.\n
                    Wij hopen u spoedig te zien in de toekomst.`
                });
            }
            //Remove candidate
            await queryCommands.deleteEnrollment(shiftId, userId);
            res.status(201).json({message: "User has been removed from the workshop"})
        }catch (e) {
            res.status(400).json({error: "enrollment_change_error", message: "Problems with removal of participant"});
        }

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
           assert(typeof unknownUser.hourRate == 'number')
        } catch (e) {
            return res.status(400).json({error: "input_error", message: "Missing inputfields"});
        }
        //Assigns Extern_Id
        //Future: Adding bankaccount number
        //Add date
        unknownUser.userId = new ObjectId();
        unknownUser.enrollDate = DateTime.now();
        try {
            //Database command
            await queryCommands.enrollUnknownUser(unknownUser, shiftId);
            res.status(201).json({message: "Unknown user successfully registered in shift."});
        }catch (e){
            res.status(400).json({error: "database_error", message: "Enrollment of unknown user went wrong."});
        }

    },
    async checkCancelationTime(req:any, res: any, next:any){
        //Initialize variables
        const userId = req.params.userId;
        const shiftId = req.params.shiftId;
        try {
            //Remove participant
            const shift = await queryCommands.getOneShift(shiftId);
            let shiftDate = shift.date;
            let now = DateTime.now().plus({hour: 48});
            if(now < shiftDate){
                next();
            } else{
                res.status(400).json({error: "resign_shift_failure", message: "Cannot remove shift, if the difference in time is less then 48 hours"});
            }
        }catch (e) {
            res.status(400).json({error: "enrollment_change_error", message: "Problems with removal of participant"});
        }

    }
}

export default controller;