import { Request, Response } from 'express';
import { queryCommands } from '../db/dbWorkshopCommands';
import jwt from 'jsonwebtoken';
import Logger from 'js-logger';
import { ObjectId } from 'mongodb';
import nodemailer, { Transporter } from 'nodemailer';
import { workshopBody } from '../models/workshopBody';

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

export async function getWorkshop(req: Request, res: Response, next: any) {
    // @ts-ignore
    const workshop = await queryCommands.getWorkshop(ObjectId(res.locals.decodedToken.id));

    return res.send({ result: workshop });
}

export async function getWorkshops(req: Request, res: Response) {
    const mongoQuery = {};

    for (let key in req.query) {
        if (['isActive', 'name'].includes(key)) {
            if (req.query[key] === 'true') {
                // @ts-ignore
                mongoQuery[key] = true;
            } else if (req.query[key] === 'false') {
                // @ts-ignore
                mongoQuery[key] = false;
            } else if (req.query[key] === 'null') {
                // @ts-ignore
                mongoQuery[key] = { $exists: false };
            } else {
                // @ts-ignore
                mongoQuery[key] = `${req.query[key]}`;
            }
        }
    }

    Logger.info(mongoQuery);

    const workshops = await queryCommands.getAllWorkshops(mongoQuery);
    Logger.info(workshops);

    return res.send({ result: workshops });
}

export async function authorizeWorkshop(
    req: Request,
    res: Response,
    next: any
) {
    const authToken = req.headers.authorization || '';
    if (!authToken) {
        return res.status(401).send({
            error: 'unauthorized',
            message: 'You need to provide authorization for this endpoint!',
        });
    }
    try {
        res.locals.decodedToken = jwt.verify(
            authToken,
            process.env.APP_SECRET || ''
        );
        next();
    } catch (err) {
        Logger.error(err);
        return res.status(401).send({
            error: 'unauthorized',
            message: 'You need to provide authorization for this endpoint!',
        });
    }
}

export async function activateWorkshop(req: Request, res: Response) {
    // @ts-ignore
    if (res.locals.decodedToken.role !== 'owner') {
        return res.status(403).send({
            error: 'forbidden',
            message: 'You do not have permission for this endpoint',
        });
    }

    const workshopId = req.params.workshopId;
    try {
        const result = await queryCommands.approveWorkshop(
            new ObjectId(workshopId),
            true
        );
        if (result.modifiedCount == 1) {
            const workshop = await queryCommands.getWorkshop(
                new ObjectId(workshopId)
            );
            const name = `${workshop.name}`;
            if (process.env.SMTP_SERVER) {
                const info = await transporter.sendMail({
                    from: process.env.SMTP_USERNAME,
                    to: workshop.emailAddress,
                    subject: `${name}, is succesvol aangemaakt`,
                    text: `U kunt nu op de website de workshop bezoeken door ${process.env.FRONTEND_URI}/workshops te bezoeken.\n\nMet vriendelijke groet\n\nSkool Workshops`,
                });
                Logger.info(info);
            }

            return res.send({ success: true });
        } else {
            return res.status(400).send({
                error: 'workshop_not_modified',
                message:
                    'This workshop could not be modified, likely because it does not exist!',
            });
        }
    } catch (err) {
        Logger.error(err);
        return res.status(400).send({
            error: 'invalid_parameters',
            message: 'The workshop ID is not valid!',
        });
    }
}

export async function deactivateWorkshop(req: Request, res: Response) {
    // @ts-ignore
    if (res.locals.decodedToken.role !== 'owner') {
        return res.status(403).send({
            error: 'forbidden',
            message: 'You do not have permission for this endpoint',
        });
    }

    const workshopId = req.params.workshopId;

    try {
        const result = await queryCommands.approveWorkshop(
            new ObjectId(workshopId),
            false
        );
        if (result.modifiedCount == 1) {
            return res.send({ success: true });
        } else {
            return res.status(400).send({ success: false });
        }
    } catch {
        return res.status(400).send({
            error: 'invalid_parameters',
            message: 'The workshop ID is not valid!',
        });
    }
}

export async function createWorkshop(req: Request, res: Response, next: any) {
    const newWorkshop: workshopBody = req.body;
    const confirmation = await queryCommands.registerWorkshop({
        _id: newWorkshop._id,
        name: newWorkshop.name,
        city: newWorkshop.city,
        street: newWorkshop.street,
        description: newWorkshop.description,
        // date: newWorkshop.Date;
        maxParticipants: newWorkshop.maxParticipants,
        imageUrl: newWorkshop.imageUrl,
        userId: newWorkshop.userId,
        isActive: newWorkshop.isActive,
    });

    if (confirmation.error !== 0) {
        res.status(400).send({
            error: 'input_invalid',
            message: 'The data you sent was not correctly formatted!',
        });
    }
    if (process.env.SMTP_SERVER) {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USERNAME,
            to: 'clinten.pique@duck-in.space',
            subject: `${newWorkshop.name} aangemaakt.`,
            text: `Bezoek ${newWorkshop.name} door ${process.env.FRONTEND_URI}/workshop te bezoeken! `,
        });
    }
    res.status(204).send();
}

export default {
    getWorkshop,
    activateWorkshop,
    authorizeWorkshop,
    deactivateWorkshop,
    getWorkshops,
    createWorkshop,
};
