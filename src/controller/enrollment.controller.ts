import {queryCommands} from "../db/databaseCommands";
import assert from "assert";
import {WorkshopShiftBody} from "../models/workshopShiftBody";
import {ObjectId} from "mongodb";
import time, {DateTime, Duration} from 'luxon';
import nodemailer, {Transporter} from "nodemailer";
import dotEnv from 'dotenv'
import {mailMethods, templateFormat} from "./templateMessage.controller";
import {triggerValues} from "../models/templateMessageBody";
import {getHoursFromTimeStampList} from "./workshopshift.controller";
import jwt from "jsonwebtoken";
import logger from "js-logger";
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

            if(process.env.SMTP_PROVIDER && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD){
                const template = await mailMethods.retrieveMailTemplate(triggerValues.shiftEnrollRequest);
                const registration = await queryCommands.getUser(new ObjectId(userId));
                let defaultTitle = `Gebruiker ${registration.firstName} ${registration.lastName}, Inschrijving ontvangen.`;
                let defaultContent = `Beste ${registration.firstName} ${registration.lastName},\nU heeft uzelf laten inschrijven voor deze workshop.\n
                     Wij hopen u spoedig te zien in de toekomst.`
                if(template){
                    let workshop = await queryCommands.getOneWorkshop(enroll.value.workshopId);
                    let title = template.title;
                    let content = template.content;
                    //Format
                    title = title.replaceAll('{name}', `${registration.firstName} ${registration.lastName}`);
                    title = title.replaceAll('{workshop}', `${workshop.name}`);
                    content = content.replaceAll('{functie}', `Workshop docent ${workshop.name}`);
                    content = content.replaceAll('{date}', enroll.value.date);
                    //Hardcoded email address to Clinten Pique(Dummy mailAddress);
                    await mailMethods.sendMail(title, content, "clinten.pique@duck-in.space");
                    logger.info("Mail send to owner");
                    //Sends confirmation mail of enrollments to enrolled user.
                    await mailMethods.sendMail(title, content, registration.emailAddress);
                    logger.info("Mail send to user");
                } else{
                    await mailMethods.sendMail(defaultTitle, defaultContent, registration.emailAddress);
                }
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

        try {
            //Delete userId from participationlist.
            const shift = await queryCommands.cancelParticipation(shiftId, userId);
            const template = await mailMethods.retrieveMailTemplate(triggerValues.shiftCancellation);
            const registration = await queryCommands.getUser(new ObjectId(userId));
            let emailAddress = req.body.emailAddress;

            if(registration){
                emailAddress = registration.emailAddress;
            }

            // Sends confirmation mail.
            if (process.env.SMTP_PROVIDER && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD && template) {
                //Retrieve template
                if(template){
                    let workshop = await queryCommands.getOneWorkshop(shift.value.workshopId);
                    let client = await queryCommands.getOneCustomer(shift.value.clientId);
                    let title = template.title;
                    let content = template.content;
                    //Format
                    if(registration){
                        title = title.replaceAll('{name}', `${registration.firstName} ${registration.lastName}`);
                        emailAddress = registration.emailAddress;
                    } else{
                        title = title.replaceAll('{name}', `Workshop docent`);
                    }
                    content = content.replaceAll('{functie}', `Workshop docent ${workshop.name}`);
                    content = content.replaceAll('{klant}', client.name);
                    content = content.replaceAll('{date}', shift.value.date);

                    await mailMethods.sendMail(title, content, emailAddress);
                } else {
                    let defaultTitle = `De inschrijving geannuleerd`;
                    let defaultContent = `U bent officieel verwijdert voor deze workshop.\n
                     Wij hopen u spoedig te zien in de toekomst.`
                    await mailMethods.sendMail(defaultTitle, defaultContent, emailAddress);
                }
            }

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
            await queryCommands.changeStatusEnrollmentParticipant(shiftId, userId, status);
            //List
            const listCandidates = await queryCommands.getCandidatesList(shiftId);
            //Filters users
            let user = listCandidates.filter((candidates: { userId: any; }) => candidates.userId == userId);
            //Removes candidate from candidates list.
            await queryCommands.deleteEnrollment(shiftId, userId);
            //Adds participant to participant list.
            const enroll = await queryCommands.confirmParticipation(shiftId, user[0]);
            //Sends confirmation mail.
            if (process.env.SMTP_PROVIDER && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD) {
                const registration = await queryCommands.getUser(new ObjectId(userId));
                await formatConfirmationMail(registration.emailAddress, shiftId, registration.firstName, registration.lastName);
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
            if (process.env.SMTP_PROVIDER && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD) {
                 const registration = await queryCommands.getUser(new ObjectId(userId));

                await formatRejectionEnrollment(shiftId, registration.emailAddress, registration.firstName, registration.lastName);
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

    },
    inputValidateInviteAction:(req:any, res:any, next:any)=>{
        const user = req.body;
        try {
            if(req.body.userId == "Unknown"){
                assert(user.firstName);
                assert(user.lastName);
                assert(user.phoneNumber);
                assert(user.hourRate);
                assert(user.emailAddress);
            }
            next()
        }catch (e) {
            res.status(400).json({error: "input_failure", message: "Not all input fields are filled in."})
        }
    }
    ,
    async sendInvitationToUser(req:any, res: any){
        //Initialize user
        const user = req.body;
        //Initialize shiftId
        const shiftId = req.params.shiftId;
        try {
            // gets shift based on shiftId
            const shift = await queryCommands.getOneShift(shiftId);
            //Gets hours from timestamps
            // const workHours = getHoursFromTimeStampList(shift.timestamps);
            //Checks if user is known or unknown
            if(user.userId != ""){
                //If it is known, it will retrieve user and its data/ firstName, lastName, tarriff
                const retrievedUser = await queryCommands.getUser(new ObjectId(user.userId));
                user.firstName = retrievedUser.firstName;
                user.lastName = retrievedUser.lastName;
                user.phoneNumber = retrievedUser.phoneNumber;
                user.hourRate = retrievedUser.hourRate;
                user.emailAddress = retrievedUser.emailAddress;
            } else {
                //If it is unknown, it will
                user.userId = new ObjectId();
            }
            //Check if duplication exist
            let userExist = await queryCommands.checkDuplicationInvitation(shiftId, user.emailAddress);

            if(userExist){
                return res.status(400).json({error: "invitation_duplication", message: "user has already been invited"});
            }
            //Generate random token.
            // @ts-ignore
            let token = jwt.sign({role: "user"}, process.env.APP_SECRET, {expiresIn: "1d"});
            user.status = "Pending";
            user.date = DateTime.now();
            //Puts token in user object.
            user.token = token;
            //Insert into request objectArray
            await queryCommands.insertInvitationToRequestArray(shiftId, user);
            //Retrieve template.
            const template = await queryCommands.getOneTemplate(triggerValues.shiftInvitation);
            //Sends mail.
            if (process.env.SMTP_PROVIDER && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD){
                if (template){
                    let title = template.title;
                    let content = template.content;
                    let workshop = await queryCommands.getOneWorkshop(shift.workshopId);
                    let klant = await queryCommands.getOneCustomer(shift.clientId);
                    //format mail. Make mail
                    title = title.replaceAll('{functie}', `${workshop.name}`);
                    content = content.replaceAll('{name}', `${user.firstName} ${user.lastName}`);
                    content = content.replaceAll('{date}', DateTime.fromJSDate(shift.date).toFormat("D"));
                    content = content.replaceAll('{arrivalTime}', DateTime.fromISO(shift.timestamps[0].startTime).minus({minute: 30}).toFormat("T").toString());
                    content = content.replaceAll('{tarrif}', `${shift.tarriff}`);
                    content = content.replaceAll('{startTime}', `${shift.timestamps[0].startTime}`);
                    content = content.replaceAll('{functie}', `docent ${workshop.name}`);
                    content = content.replaceAll('{klant}', klant.name);
                    content = content.replace('{Invitation_link}', `${req.hostname}/api/workshop/shift/${shiftId}/accepted/${user.userId}/enroll/${token}/invitation`);
                    content = content.replace('{Rejection_link}', `${req.hostname}/api/workshop/shift/${shiftId}/enroll/${user.userId}/reject/${token}/no`);
                    content = content.replaceAll('{tabelShift}', templateFormat
                        .getTableOfShiftInfo(
                            klant.name,
                            DateTime.fromJSDate(shift.date).toFormat("D"),
                            shift.timestamps[0].startTime,
                            `${user.firstName} ${user.lastName}`,
                        `docent ${workshop.name}`,
                            shiftId,
                            req.hostname,
                            user.userId,
                            token));
                    //Sends mail
                   await mailMethods.sendMail(title, content, user.emailAddress);
                } else{
                    //placeholder default, just in case
                    await mailMethods.sendMail("Bevestig inschrijving", `<a href="${req.hostname}/api/workshop/shift/${shiftId}/accepted/${user.userId}/enroll/${token}/invitation">Accepteer</a> <br/><br/><a href="${req.hostname}/api/workshop/shift/${shiftId}/enroll/${user.userId}/reject/${token}/no">Accepteer</a> `, user.emailAddress);
                }
            }
            return res.status(200).json();
        }catch (e:any) {
            res.status(400).json({error: "invitation has failed", message: e.message})
        }

    }
    ,
    async acceptInvitation(req:any, res:any){
        const shiftId = req.params.shiftId;
        const userId = req.params.userId;
        const token = req.params.token;
        try {
            //Pull out invitation
            const returningShift = await queryCommands.pullOutInvitation(shiftId, userId);
            logger.info(returningShift.value.invitations);
            let invitations = returningShift.value.invitations;
            // @ts-ignore
            invitations = invitations.filter(user => user.userId == userId);
            let user = invitations[0];
            user.status = "Current";
            //Check if token is present. To prevent duplication
            assert(user.token == token);
            //Put the new object in the participation
            await queryCommands.confirmParticipation(shiftId, user);
            await formatConfirmationMail(user.emailAddress, shiftId, user.firstName, user.lastName);
            res.status(301).redirect(process.env.FRONTEND_URI);
        }catch (e:any) {
            res.status(400).json({error: "acceptance_error", message: "something went wrong with accepting participation", stack: e.message})
        }
    },
    async rejectInvitation(req:any, res:any){
        const shiftId = req.params.shiftId;
        const userId = req.params.userId;
        const token = req.params.token;
        try {
            const returningShift = await queryCommands.pullOutInvitation(shiftId, userId);
            let invitations = returningShift.value.invitations;
            // @ts-ignore
            invitations = invitations.filter(user => user.userId == userId);
            let user = invitations[0];
            //Check if token is present. To prevent duplication
            assert(user.token == token);
            res.status(301).redirect(process.env.FRONTEND_URI);
        } catch (e:any) {
            res.status(400).json({error: "acceptance_error", message: "something went wrong with accepting participation", stack: e.message});
        }
    }
}

export async function formatConfirmationMail(emailAddress:string, shiftId:string, firstName: string, lastName:string) {
    try {
        const template = await queryCommands.getOneTemplate(triggerValues.shiftConfirmation);
        const shift = await queryCommands.getOneShift(shiftId);
        const workshop = await queryCommands.getOneWorkshop(shift.workshopId);
        const client =await queryCommands.getOneCustomer(shift.clientId);
        if(template){
            let title = template.title;
            let content = template.content;

            title = title.replaceAll("{name}", `${firstName} ${lastName}`);

            content = content.replaceAll("{name}", `${firstName} ${lastName}`);
            content = content.replaceAll("{functie}", `Workshop ${workshop.name}`);
            content = content.replaceAll('{klant}', client.name);
            content = content.replaceAll('{date}', `${DateTime.fromJSDate(shift.date).toFormat("D")}`);
            content = content.replaceAll('{arrivalTime}', `${DateTime.fromISO(shift.timestamps[0].startTime).minus({minute: 30}).toFormat("T")}`);
            content = content.replaceAll('{startTime}', `${shift.timestamps[0].startTime}`);
            content = content.replaceAll('{endTime}', `${shift.timestamps[shift.timestamps.length - 1].endTime}`)
            content = content.replaceAll('{tarrif}', `${shift.total_Amount}`);
            content = content.replaceAll('{targetAudience}', `${shift.targetAudience}`);
            content = content.replaceAll('{workshopInfo}', workshop.description);
            mailMethods.sendMail(title, content, emailAddress);
        } else{
            let content  = `Beste ${firstName} ${lastName},\nU bent officieel ingeschreven voor de workshop.\n
                     Wij hopen u spoedig te zien op uw dienst.`;
            let title = `Gebruiker ${firstName} ${lastName} is definitief ingeschreven.`;
            await mailMethods.sendMail(title, content, emailAddress);
        }
    }catch (e) {
        return e;
    }
}

export async function formatRejectionEnrollment(shiftId:string, emailAddress:string, firstName:string, lastName:string) {
    //Retrieve template
    try {
        const template = await mailMethods.retrieveMailTemplate(triggerValues.shiftRejection);
        const shift = await queryCommands.getOneShift(shiftId);
        if(template){
            let workshop = await queryCommands.getOneWorkshop(shift.workshopId);
            let client = await queryCommands.getOneCustomer(shift.clientId);
            let title = template.title;
            let content = template.content;
            //Format
            title = title.replaceAll('{name}', `${firstName} ${lastName}`);
            content = content.replaceAll('{functie}', `Workshop docent ${workshop.name}`);
            content = content.replaceAll('{klant}', client.name);
            content = content.replaceAll('{date}', shift.date);
            await mailMethods.sendMail(title, content, emailAddress);
        } else {
            let defaulttitle = `Gebruiker ${firstName} ${lastName}, de inschrijving is afgekeurd.`;
            let defaultcontent = `Beste ${firstName} ${lastName},\nU bent officieel geweigerd voor deze workshop.\n
                     Wij hopen u spoedig te zien in de toekomst.`
            await mailMethods.sendMail(defaulttitle, defaultcontent, emailAddress);
        }
    }catch (e) {
        return e;
    }

}

export default controller;