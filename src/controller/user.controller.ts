import {Request, Response} from 'express';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import Logger from "js-logger";
import { ObjectId } from "mongodb";
import nodemailer, {Transporter} from 'nodemailer';

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


export async function getUser(req: Request, res: Response, next: any) {
    // @ts-ignore
    const user = await queryCommands.getUser(ObjectId(res.locals.decodedToken.id));

    return res.send({result: user});
}

export async function getUsers(req: Request, res: Response) {
    if (res.locals.decodedToken.role !== 'owner') {
        return res.status(403).send({error: "forbidden", message: "You do not have permission for this endpoint"})
    }

    const mongoQuery = {};

    for (let key in req.query) {
        if (["isActive", "firstName", "lastName"].includes(key)) {
            if (req.query[key] === 'true') {
                // @ts-ignore
                mongoQuery[key] = true
            } else if (req.query[key] === 'false') {
                // @ts-ignore
                mongoQuery[key] = false;
            } else if (req.query[key] === 'null') {
                // @ts-ignore
                mongoQuery[key] = {'$exists': false};
            } else {
                // @ts-ignore
                mongoQuery[key] = `/${req.query[key]}/`;
            }
        }
    }



    Logger.info(mongoQuery)

    const users = await queryCommands.getAllUsers(mongoQuery)
    Logger.info(users);

    return res.send({result: users});
}

export async function authorizeUser(req: Request, res: Response, next: any) {
    const authToken = req.headers.authorization || "";
    if (!authToken) {
        return res.status(401).send({error: "unauthorized", message: "You need to provide authorization for this endpoint!"})
    }
    try {
        res.locals.decodedToken = jwt.verify(authToken, process.env.APP_SECRET || "");
        next()
    } catch (err) {
        return res.send({error: "unauthorized", message: "You need to provide authorization for this endpoint!"})
    }

}

export async function activateUser(req: Request, res: Response) {
    // @ts-ignore
    if (res.locals.decodedToken.role !== 'owner') {
        return res.status(403).send({error: "forbidden", message: "You do not have permission for this endpoint"})
    }

    const userId = req.params.userId;
    try {
        const result = await queryCommands.approveUser(new ObjectId(userId), true);
        if (result.modifiedCount == 1) {

            const user = await queryCommands.getUser(new ObjectId(userId));
            const name = `${user.firstName} ${user.lastName}`;
            if (process.env.SMTP_SERVER) {
                const info = await transporter.sendMail({
                    from: process.env.SMTP_USERNAME,
                    to: user.emailAddress,
                    subject: `${name}, Uw Skool Werknemer account is geaccepteerd`,
                    text: `Beste ${name},\n\nU kunt nu inloggen op de website door ${process.env.FRONTEND_URI}/sign-in te bezoeken.\n\nMet vriendelijke groet\n\nSkool Workshops`
                })
                Logger.info(info);
            }

            return res.send({success: true})
        } else {
            return res.status(400).send({error: "user_not_modified", message: "This user could not be modified, likely because it does not exist!"});
        }
    } catch (err) {
        Logger.error(err);
        return res.status(400).send({error: "invalid_parameters", message: "The user ID is not valid!"})
    }

}

export async function deactivateUser(req: Request, res: Response) {
    // @ts-ignore
    if (res.locals.decodedToken.role !== 'owner') {
        return res.status(403).send({error: "forbidden", message: "You do not have permission for this endpoint"})
    }

    const userId = req.params.userId;

    try {
        const result = await queryCommands.approveUser(new ObjectId(userId), false);
        if (result.modifiedCount == 1) {
            return res.send({success: true})
        } else {
            return res.status(400).send({success: false});
        }
    } catch {
        return res.status(400).send({error: "invalid_parameters", message: "The user ID is not valid!"})
    }
}



export default {getUser, activateUser, authorizeUser, deactivateUser, getUsers}