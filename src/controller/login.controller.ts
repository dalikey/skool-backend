//Imports
import assert from 'assert'
import { queryCommands } from '../db/databaseCommands';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

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
                error: message
            }
            res.status(401).json({ err })
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
                    jwt.sign({ id: getUser._id, roles: getUser.role, firstName: getUser.firstName, lastName: getUser.lastName },
                        'SecretKey', { expiresIn: "1d" },
                        (err, token) => {
                        if (err) { throw err; };
                        delete getUser.password;
                        getUser.token = token;
                        res.status(200).json({
                            status: 200,
                            result: getUser
                        });
                    });
                } else {
                    res.status(400).json({
                        status: 400,
                        error: "User has not been activated."
                    })
                }
            } else {
                res.status(401).json({
                    status: 401,
                    error: "Login failed."
                })
            }
        } else {
            res.status(404).json({
                status: 404,
                error: "Login failed."
            })
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