//Imports
import assert from 'assert'
import { queryCommands } from '../db/databaseCommands';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
// @ts-ignore
import mailer from 'nodemailer';
import {authorizationMethods} from "./authorization.controller";

const transporter = mailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USERNAME, // generated ethereal user
        pass: process.env.SMTP_PASSWORD, // generated ethereal password
    },
})

const loginController = {

    validateToken:(req:any, res:any, next:any)=>{
        const authToken = req.headers.authorization || "";
        if (!authToken) {
            return res.status(401).send({error: "unauthorized", message: "You need to provide authorization for this endpoint!"})
        }
        try {
            res.locals.decodedToken = jwt.verify(authToken, process.env.RANDOM_SECRET || "");
            assert(res.locals.decodedToken.exp > new Date().getTime()/ 1000);
            next()
        } catch (err) {
            return res.send({error: "unauthorized", message: "You need to provide authorization for this endpoint!"})
        }
    }
    ,
    validateEmail:(req: any, res: any, next:any)=>{
        try {
            assert(req.body.emailAddress);
            next();
        }catch (error: any){
            res.status(401).json({error: "wrong_input", message: "Empty field"});
        }
    }
    ,
    //Inputvalidation login
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

    async sendNewPasswordLink(req: any, res: any){
        //Sends email to correspondent user
        const user = await queryCommands.retrieveEmail(req.body.emailAddress.toLowerCase());
        if(user){
            //Generates token
            const generateToken = jwt.sign({pr_uid:user._id}, process.env.RANDOM_SECRET || "", {expiresIn: process.env.RANDOM_EXPIRE});
            //Link of password change page
            const link = `${process.env.FRONTEND_URI}/vergeten_wachtwoord/${generateToken}`;
            const info = await transporter.sendMail({
                from: process.env.SMTP_USERNAME,
                to: user.emailAddress,
                subject: `Hier is uw wachtwoord reset link.`,
                text: `Hallo ${user.firstName} ${user.lastName},\n\nHier is uw wachtwoordherstel link.\nKlik de link hieronder om een nieuw wachtwoord in te voeren.\nLink: ${link}\n\nMet vriendelijke groet,\nSkool Workshops`
            });
            res.status(200).json({success: true});
        } else{
            res.status(401).json({error: "retrieval_failure", message: "user does not exist"});
        }
    }
    ,
    async changeForgottenPassword(req: any, res:any){
        let newPassword = req.body.password;
        const isValid = authorizationMethods.validatePassword(newPassword);
        let decodedToken = res.locals.decodedToken;
        newPassword = await authorizationMethods.hashNewPassword(newPassword);
        try {
            assert(isValid);
            // @ts-ignore
            const query = await queryCommands.updatePassword(decodedToken.pr_uid, newPassword);
            res.status(200).json({message: "Update succeeded"});
        } catch (error){
            res.status(404).json({error: "update failed", message: "Password update has failed"});
        }
    }
    ,
    //Login method
    async userLogin(req: any, res: any) {
        const loginData = req.body;
        let getUser = await queryCommands.loginUser(loginData);
        if (getUser) {
            const correctPassword = await authorizationMethods.checkPassword(loginData.password, getUser.password);
            if (correctPassword) {
                if (getUser.isActive) {
                    jwt.sign({ id: getUser._id, role: getUser.role},
                        process.env.RANDOM_SECRET || "", { expiresIn: "1d" },
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

export default loginController;