import {queryCommands} from "../db/databaseCommands";
import assert from "assert";
import {WorkshopShiftBody} from "../models/workshopShiftBody";
import {ObjectId} from "mongodb";
import time, {DateTime, Duration} from 'luxon';
import nodemailer, {Transporter} from "nodemailer";
import dotEnv from 'dotenv'
import {mailMethods} from "./templateMessage.controller";
import {triggerValues} from "../models/templateMessageBody";
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

            if(process.env.SMTP_SERVER){
                const template = await mailMethods.retrieveMailTemplate(triggerValues.shiftEnrollRequest);
                const registration = await queryCommands.getUser(new ObjectId(userId));
                let title = `Gebruiker ${registration.firstName} ${registration.lastName}, Inschrijving ontvangen.`;
                let content = `Beste ${registration.firstName} ${registration.lastName},\nU heeft uzelf laten inschrijven voor deze workshop.\n
                     Wij hopen u spoedig te zien in de toekomst.`
                if(template){
                    let workshop = await queryCommands.getOneWorkshop(enroll.value.workshopId);
                    title = template.title;
                    content = template.content;
                    //Format
                    title = title.replace('{name}', `${registration.firstName} ${registration.lastName}`);
                    title = title.replace('{workshop}', `${workshop.name}`);
                    content = content.replace('{functie}', `Workshop docent ${workshop.name}`);
                    content = content.replace('{date}', enroll.value.date);
                }
                await mailMethods.sendMail(title, content, registration.emailAddress);
            }
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
            const shift = await queryCommands.cancelParticipation(shiftId, userId);
            const template = await mailMethods.retrieveMailTemplate(triggerValues.shiftCancellation);
            const unknownEmail = req.body.emailAddress;
            // Sends confirmation mail.
            if (process.env.SMTP_SERVER && template) {
                //Retrieve template
                let title = `De inschrijving geannuleerd`;
                let content = `U bent officieel verwijdert voor deze workshop.\n
                     Wij hopen u spoedig te zien in de toekomst.`
                if(template){
                    const registration = await queryCommands.getUser(new ObjectId(userId));
                    let workshop = await queryCommands.getOneWorkshop(shift.value.workshopId);
                    let client = await queryCommands.getOneCustomer(shift.value.clientId);
                    title = template.title;
                    content = template.content;
                    //Format
                    title = title.replace('{name}', `${registration.firstName} ${registration.lastName}`);
                    content = content.replace('{functie}', `Workshop docent ${workshop.name}`);
                    content = content.replace('{klant}', client.name);
                    content = content.replace('{date}', shift.value.date);
                    await mailMethods.sendMail(title, content, registration.emailAddress);
                } else if(unknownEmail){
                    await mailMethods.sendMail(title, content, req.body.emailAddress);
                }
            }

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
            //List
            const listCandidates = await queryCommands.getCandidatesList(shiftId);
            //Filters users
            let user = listCandidates.filter((candidates: { userId: any; }) => candidates.userId == userId);
            //Removes candidate from candidates list.
            const removeCandidate = await queryCommands.deleteEnrollment(shiftId, userId);
            //Adds participant to participant list.
            const enroll = await queryCommands.confirmParticipation(shiftId, user[0]);
            //Sends confirmation mail.
            if (process.env.SMTP_SERVER) {
                 const registration = await queryCommands.getUser(new ObjectId(userId));
                 //Get template mail
                 const template = await mailMethods.retrieveMailTemplate(triggerValues.shiftConfirmation);
                 let content  = `Beste ${registration.firstName} ${registration.lastName},\nU bent officieel ingeschreven voor de workshop.\n
                     Wij hopen u spoedig te zien op uw dienst.`;
                 let title = `Gebruiker ${registration.firstName} ${registration.lastName} is definitief ingeschreven.`;
                 //Checks if template found
                 if(template){
                     //Get workshop
                     let workshop = await  queryCommands.getOneWorkshop(enroll.value.workshopId);
                     //Get client
                     let client = await queryCommands.getOneCustomer(enroll.value.clientId);
                     title = template.title;
                     content = template.content;
                     //Formats string
                     title = title.replace("{name}", `${registration.firstName} ${registration.lastName}`);
                     content = content.replace("{name}", `${registration.firstName} ${registration.lastName}`);
                     content = content.replace("{functie}", `Workshop ${workshop.name}`);
                     content = content.replace('{klant}', client.name);
                     content = content.replace('{date}', `${enroll.value.date}`);
                     content = content.replace('{arrivalTime}', `${DateTime.fromISO(enroll.value.timestamps[0].startTime).toISOTime().toString()}`);
                     content = content.replace('{startTime}', `${enroll.value.timestamps[0].startTime}`);
                     content = content.replace('{endTime}', `${enroll.value.timestamps[enroll.value.timestamps.length - 1].endTime}`)
                     content = content.replace('{tarrif}', `${enroll.value.total_Amount}`);
                     content = content.replace('{targetAudience}', `${enroll.value.targetAudience}`);
                     content = content.replace('{workshopInfo}', workshop.description);
                     //
                 }
                 await mailMethods.sendMail(title, content, registration.emailAddress);
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
                 //Retrieve template
                 const template = await mailMethods.retrieveMailTemplate(triggerValues.shiftRejection);
                 let title = `Gebruiker ${registration.firstName} ${registration.lastName}, de inschrijving is afgekeurd.`;
                 let content = `Beste ${registration.firstName} ${registration.lastName},\nU bent officieel geweigerd voor deze workshop.\n
                     Wij hopen u spoedig te zien in de toekomst.`

                if(template){
                    let workshop = await queryCommands.getOneWorkshop(enrollmentStatus.value.workshopId);
                    let client = await queryCommands.getOneCustomer(enrollmentStatus.value.clientId);
                    title = template.title;
                    content = template.content;
                    //Format
                    title = title.replace('{name}', `${registration.firstName} ${registration.lastName}`);
                    content = content.replace('{functie}', `Workshop docent ${workshop.name}`);
                    content = content.replace('{klant}', client.name);
                    content = content.replace('{date}', enrollmentStatus.value.date);
                }
                await mailMethods.sendMail(title, content, registration.emailAddress);
                 // const info = await transporter.sendMail({
                 //    from: process.env.SMTP_USERNAME,
                 //     to: registration.emailAddress,
                 //     subject: title,
                 //     text: content
                 // });
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
        try {
            //Remove participant
            await queryCommands.cancelParticipation(shiftId, userId);
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