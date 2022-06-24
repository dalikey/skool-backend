import bcrypt from 'bcrypt';
import assert from 'assert';
import { Request, Response } from 'express';
import { queryCommands } from '../db/databaseCommands';
import { registrationBody } from '../models/registrationBody';
import nodemailer, {Transporter} from "nodemailer";
import {mailMethods} from "./templateMessage.controller";
import {triggerValues} from "../models/templateMessageBody";

export const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
export const capitalRegex = /[A-Z]+/;
export const digitRegex = /[1-9]+/;

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

export async function verifyInput(req: Request, res: Response, next: any) {
    const registration: registrationBody = req.body;

    try {
        assert(registration.password == registration.passwordConfirm);
        assert(registration.password.length >= 8);
        assert(registration.password.match(capitalRegex));
        assert(registration.password.match(digitRegex));
        assert(registration.emailAddress.toLowerCase().match(emailRegex));
        assert(registration.firstName)
        assert(registration.lastName)
        next();
    } catch (err) {
        return res.status(400).send({"error": "input_invalid", "message": "The data you sent was not correctly formatted!"});
    }
}

export async function hashPashword(req: Request, res: Response, next: any) {
    const registration: registrationBody = req.body;
    res.locals.password = await bcrypt.hash(registration.password, 6);
    next();
    
}

export async function registerUser(req: Request, res: Response, next: any) {
    const registration: registrationBody = req.body;
    registration.emailAddress = registration.emailAddress.toLowerCase();
    const confirmation = await queryCommands.registerUser({
        emailAddress: registration.emailAddress,
        password: res.locals.password,
        firstName: registration.firstName,
        lastName: registration.lastName,
        role: "user"
    });

    if (confirmation.error !== 0) {
        res.status(400).send({error: "input_invalid", message: "The data you sent was not correctly formatted!"});
    }
    if (process.env.SMTP_SERVER) {

        let template = await queryCommands.getOneTemplate(triggerValues.registrationRequest);
        if(template){
            let content = template.content;
            let title = template.title;
            title = title.replaceAll('{name}', `${registration.firstName} ${registration.lastName}`);
            content = content.replaceAll('{name}', `${registration.firstName} ${registration.lastName}`);

            await mailMethods.sendMail(title, content, registration.emailAddress);
            // @ts-ignore
            await mailMethods.sendMail(`<p>${registration.firstName} ${registration.lastName} heeft zich geregistreerd.`, `${registration.firstName} ${registration.lastName} Goedgekeurd moeten worden door de het management team van Skool</p>`, process.env.SMTP_USERNAME);
        } else {
            // @ts-ignore
            await mailMethods.sendMail(`Gebruiker ${registration.firstName} ${registration.lastName} geregistreerd.`, `${registration.firstName} ${registration.lastName} Goedgekeurd moeten worden door de het management team van Skool`, process.env.SMTP_USERNAME);
        }

    }
    res.status(204).send();
}

export default {verifyInput: verifyInput, hashPashword: hashPashword, registerUser: registerUser}