import bcrypt from 'bcrypt';
import assert from 'assert';
import { Request, Response } from 'express';
import { queryCommands } from '../db/databaseCommands';
import { registrationBody } from '../models/registrationBody';

export async function verifyInput(req: Request, res: Response, next: any) {
    const registration: registrationBody = req.body;
    const capitalRegex = /[A-Z]+/;
    const digitRegex = /[1-9]+/;
    const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
    try {
        assert(registration.password == registration.passwordConfirm);
        assert(registration.password.length >= 8);
        assert(registration.password.match(capitalRegex));
        assert(registration.password.match(digitRegex));
        assert(registration.emailAddress.match(emailRegex));
        next();
    } catch (err) {
        return res.send({"error": "input_invalid", "message": "The data you sent was not correctly formatted!"});
    }
}

export async function hashPashword(req: Request, res: Response, next: any) {
    const registration: registrationBody = req.body;
    res.locals.password = await bcrypt.hash(registration.password, 6);
    next();
    
}

export async function registerUser(req: Request, res: Response, next: any) {
    const registration: registrationBody = req.body;
    await queryCommands.registerUser({emailAddress: registration.emailAddress, password: res.locals.password});
    res.status(204).send();
}

export default {verifyInput: verifyInput, hashPashword: hashPashword, registerUser: registerUser}