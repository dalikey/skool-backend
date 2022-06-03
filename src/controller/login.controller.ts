//Imports
import assert from 'assert'
import { queryCommands } from '../db/databaseCommands';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();
const loginController = {
    //Inputvalidation
    validateInput: (req: any, res: any, next: any) => {
        console.log('Input validation');
        let userLogin = req.body;
        try {
            assert(typeof userLogin.emailAddress == 'string', 'email must be filled in.');
            assert(typeof userLogin.password == 'string', 'Password must be filled in.');
            req.body.emailAddress = userLogin.emailAddress.toLowerCase();
            next();
        } catch (error: any) {
            let ErrorMessage: string = error.message
            res.status(401).json({ error:  "wrong_input", message: ErrorMessage });
        }
    }
    ,
    //Login method
    async userLogin(req: any, res: any) {
        const loginData = req.body;
        let getUser = await queryCommands.loginUser(loginData);
        if (getUser) {
            const correctPassword = await checkPassword(loginData.password, getUser.password);
            if (correctPassword) {
                if (getUser.isActive) {
                    jwt.sign({ id: getUser._id, roles: getUser.role},
                        process.env.APP_SECRET || "", { expiresIn: "1d" },
                        (err, token) => {
                        if (err) { throw err; };
                        delete getUser.password;
                        delete getUser.emailAddress;
                        delete getUser._id;
                        getUser.token = token;
                        res.status(200).json({result: getUser});
                    });
                } else {
                    res.status(400).json({  error: "login_failure",message: "User has not been activated."});
                }
            } else {
                res.status(401).json({ error: "login_failure",message: "Login failed." });
            }
        } else {
            res.status(404).json({ error: "login_failure", message: "Login failed." });
        }
    }
}

async function checkPassword(password: string, queryResultPassword: string,) {
    return bcrypt.compare(password, queryResultPassword)
        .then(isCorrect => {
            return isCorrect;
        })
}

export default loginController;