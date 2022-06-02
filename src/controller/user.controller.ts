import bcrypt from 'bcrypt';
import assert from 'assert';
import { Request, Response } from 'express';
import { queryCommands } from '../db/databaseCommands';
import { registrationBody } from '../models/registrationBody';
import jwt, {JsonWebTokenError} from "jsonwebtoken";
import Logger from "js-logger";
import { ObjectId } from "mongodb";



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
                mongoQuery[key] = req.query[key];
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
        const decodedToken = jwt.verify(authToken,  process.env.APP_SECRET || "");
        res.locals.decodedToken = decodedToken;
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

    const result = await queryCommands.approveUser(new ObjectId(userId), true);
    if (result.modifiedCount == 1) {
        return res.send({success: true})
    } else {
        return res.status(500).send({success: false});
    }
}

export async function deactivateUser(req: Request, res: Response) {
    // @ts-ignore
    if (res.locals.decodedToken.role !== 'owner') {
        return res.status(403).send({error: "forbidden", message: "You do not have permission for this endpoint"})
    }

    const userId = req.params.userId;

    await queryCommands.approveUser(new ObjectId(userId), false);
}



export default {getUser, editUser: () => {}, activateUser, authorizeUser, deactivateUser, getUsers}