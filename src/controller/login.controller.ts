//Imports
import assert from 'assert'
import { queryCommands } from '../db/databaseCommands';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const loginController = {
    //Inputvalidation
    validateInput: (req: any, res: any, next: any) => {
        console.log('Input validation');
        let userLogin = req.body;
        try {
            assert(typeof userLogin.emailAddress == 'string', 'email must be filled in.');
            assert(typeof userLogin.password == 'string', 'Password must be filled in.');
            next();
        } catch (error: any) {
            let message: string = error.message
            const err = {
                status: 401,
                error_message: message
            }
            res.status(401).json({ err })
        }
    }
    ,
    //Login method
    userLogin: (req: any, res: any) => {
        const loginData = req.body;
        queryCommands.loginUser(loginData).then(result => {
            queryCommands.closeDB();
            if (result) {
                //TODO Check if account is active/activated.
                //Bycrypt will check the password.
                checkPassword(result, loginData.password).then(value => {
                    if (value) {
                        //Generates token
                        jwt.sign({ userId: result._id }, 'secret', { expiresIn: '1d' }, (err: any, token) => {
                            let user = { ...result, token };
                            res.status(200).json({
                                status: 200,
                                result: user
                            })
                        })
                    } else {
                        res.status(401).json({
                            status: 401,
                            result: "User does not have the right password."
                        })
                    }
                })
            } else {
                res.status(404).json({
                    status: 404,
                    result: "User not found"
                })
            }
        })
    }
}

async function checkPassword(result: any, password: string) {
    const v = await bcrypt
        .compare(password, result.password)
        .then(isCorrect => {
            return isCorrect;
        });
    return v;
}

export default loginController;