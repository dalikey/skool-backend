import {Request, Response} from 'express';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import Logger from "js-logger";
import { ObjectId } from "mongodb";
import nodemailer, {Transporter} from 'nodemailer';
import {User, userBody} from "../models/userBody";
import assert from "assert";
import {authorizationMethods} from "./authorization.controller";
import {capitalRegex, digitRegex} from "./registration.controller";
import fileUpload from "express-fileupload";
import {mailMethods} from "./templateMessage.controller";
import {triggerValues} from "../models/templateMessageBody";


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


export async function getUser(req: Request, res: Response) {
    // @ts-ignore
    try {
        assert (req.params.userId)
        if (res.locals.decodedToken.role === 'admin' || res.locals.decodedToken.role === 'owner') {
            const user = await queryCommands.getUser(new ObjectId(req.params.userId));
            if (user) {
                return res.send({result: user})
            } else {
                return res.status(404).send({error: "not_found"})
            }
        } else {
            return res.status(403).send({error: "forbidden"})
        }
    } catch (err) {
        const user = await queryCommands.getUser(new ObjectId(res.locals.decodedToken.id));
        return res.send({result: user});
    }

}

export async function getUsers(req: Request, res: Response) {
    if (res.locals.decodedToken.role !== 'owner' && res.locals.decodedToken.role !== 'admin') {
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
                mongoQuery[key] = `${req.query[key]}`;
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
        Logger.error(err);
        return res.status(401).send({error: "unauthorized", message: "You need to provide authorization for this endpoint!"})
    }

}

export async function activateUser(req: Request, res: Response) {
    // @ts-ignore
    if (res.locals.decodedToken.role !== 'owner' && res.locals.decodedToken.role !== 'admin') {
        return res.status(403).send({error: "forbidden", message: "You do not have permission for this endpoint"})
    }

    const userId = req.params.userId;
    try {
        const result = await queryCommands.approveUser(new ObjectId(userId), true);
        if (result.modifiedCount == 1) {
            if (process.env.SMTP_PROVIDER && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD) {
                const user = await queryCommands.getUser(new ObjectId(userId));
                const name = `${user.firstName} ${user.lastName}`;
                //Gets right mail.
                let htmlContent = await mailMethods.retrieveMailTemplate(triggerValues.registrationAccept);
                //if html is undefined, it fall back to the default mail.
                if(!htmlContent){
                    htmlContent.content = `Beste ${name},\n\nU kunt nu inloggen op de website door ${process.env.FRONTEND_URI}/sign-in te bezoeken.\n\nMet vriendelijke groet\n\nSkool Workshops`;
                    htmlContent.title = `${name}, Uw Skool Werknemer account is geaccepteerd`
                } else{
                    //Format mail html with proper customization
                    htmlContent.content = htmlContent.content.replace('{name}', name);
                    htmlContent.content = htmlContent.content.replace('{url}', `${process.env.FRONTEND_URI}/sign-in`);
                }
                const sendMail = await mailMethods.sendMail(htmlContent.title, htmlContent.content,  user.emailAddress);
                Logger.info(sendMail);
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
    if (res.locals.decodedToken.role !== 'owner' && res.locals.decodedToken.role !== 'admin') {
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

export async function editUser(req: Request, res: Response) {
    if (res.locals.decodedToken.id !== req.params.userId && res.locals.decodedToken.role !== "owner") {
        return res.status(403).send({error: "forbidden", message: "You do not have permission for this endpoint"});
    }

    const currentUser = await queryCommands.getUser(new ObjectId(req.params.userId));
    if (!currentUser) {
        return res.status(400).send({error: "not_found", message: "This user was not found!"})
    }

    if (req.headers["content-type"] === 'application/json') {

        const ownerOnly = ["firstName", "lastName", "role", "hourRate"];

        const userEdit: userBody = new User(req.body);

        Logger.info('before pw')

        if (res.locals.decodedToken.role !== "owner") {
            const loginUser = await queryCommands.loginUser({emailAddress: currentUser.emailAddress});
            try {
                let password: string;
                if (userEdit.passwordInfo.currentPassword) {
                    password = userEdit.passwordInfo.currentPassword;
                } else {
                    // @ts-ignore
                    password = userEdit.passwordInfo;
                }
                if (!await authorizationMethods.checkPassword(password, loginUser.password)) {
                    return res.status(403).send({
                        error: "forbidden",
                        message: "You do not have permission for this endpoint"
                    });
                }
            } catch (err) {
                return res.status(401).send({
                    error: "missing_password",
                    message: "A password must be supplied to edit your profile!"
                })
            }
        }

        Logger.info('after pw')

        let queryData: Object = {};

        for (let key in userEdit) {
            // @ts-ignore
            if (userEdit[key] && key !== 'passwordInfo' && key !== 'rejected' && !ownerOnly.includes(key)) {
                // @ts-ignore
                queryData[key] = userEdit[key];
            } else {
                // @ts-ignore
                if (res.locals.decodedToken.role === 'owner' && ownerOnly.includes(key) && userEdit[key] && key !== 'passwordInfo' && key !== 'rejected') {
                    // @ts-ignore
                    queryData[key] = userEdit[key];
                }
            }
        }


        Logger.info(queryData)
        try {
            if (userEdit.passwordInfo.password && userEdit.passwordInfo.passwordConfirm) {
                try {
                    const password = userEdit.passwordInfo.password;
                    const confirm = userEdit.passwordInfo.passwordConfirm;
                    assert(password === confirm);
                    assert(password.length >= 8);
                    assert(password.match(digitRegex));
                    assert(password.match(capitalRegex));
                    // @ts-ignore
                    queryData['password'] = await authorizationMethods.hashNewPassword(password);
                } catch (err) {

                }
            }
        } catch (err) {}

        Logger.info('after pw check')

        const updatedUser = await queryCommands.updateUser(new ObjectId(req.params.userId), queryData);

        Logger.info(updatedUser)

        return res.send({result: updatedUser, rejected: userEdit.rejected});

    } else if (req.headers["content-type"]?.startsWith('multipart/form-data')) {
        try {
            if (res.locals.decodedToken.role !== "owner") {
                const loginUser = await queryCommands.loginUser({emailAddress: currentUser.emailAddress});
                try {
                    if (!await authorizationMethods.checkPassword(req.body.currentPassword, loginUser.password)) {
                        return res.status(403).send({
                            error: "forbidden",
                            message: "You do not have permission for this endpoint"
                        });
                    }
                } catch (err) {
                    return res.status(401).send({
                        error: "missing_password",
                        message: "A password must be supplied to edit your profile!"
                    })
                }
            }
            assert(req.files);
            let profileData;
            let VOGData;
            let legitimatieFrontData;
            let legitimatieBackData;

            const profilePicture: fileUpload.UploadedFile | fileUpload.UploadedFile[]  = req.files.profilePicture;
            if (profilePicture && "data" in profilePicture) {
                profileData = profilePicture.data.toString('base64');
            }
            const VOG: fileUpload.UploadedFile | fileUpload.UploadedFile[] = req.files.VOG;
            if (VOG && "data" in VOG) {
                VOGData = VOG.data.toString('base64');
            }
            const legitimatieFront: fileUpload.UploadedFile | fileUpload.UploadedFile[] = req.files.legitimatieFront;
            if (legitimatieFront && "data" in legitimatieFront) {
                legitimatieFrontData = legitimatieFront.data.toString('base64');
            }
            const legitimatieBack: fileUpload.UploadedFile | fileUpload.UploadedFile[] = req.files.legitimatieBack;
            if (legitimatieBack && "data" in legitimatieBack) {
                legitimatieBackData = legitimatieBack.data.toString('base64')
            }

            const queryData = {};
            if (profileData) {
                // @ts-ignore
                queryData['profilePicture'] = profileData;
            }
            if (VOGData) {
                // @ts-ignore
                queryData['VOG'] = VOGData;
            }
            if (legitimatieFrontData) {
                // @ts-ignore
                queryData['legitimatieFront'] = legitimatieFrontData;
            }

            if (legitimatieBackData) {
                // @ts-ignore
                queryData['legitimatieBack'] = legitimatieBackData;
            }
            const updateduser = await queryCommands.updateUser(new ObjectId(req.params.userId), queryData)
            res.send({result: updateduser})
        } catch (err) {
            Logger.error(err);
            res.status(400).send({error: "no_files", message: "Please provide files for uploading!"})
        }
    }
}

export async function deleteUser(req: Request, res: Response) {
    if (res.locals.decodedToken.role !== "owner") {
        return res.status(403).send({error: "forbidden", message: "You do not have permission for this endpoint"});
    }

    const success = await queryCommands.deleteUser(new ObjectId(req.params.userId));

    if (success) {
        return res.status(204).send()
    } else {
        return res.status(400).send()
    }
}

export default { getUser, activateUser, authorizeUser, deactivateUser, getUsers, editUser, deleteUser }