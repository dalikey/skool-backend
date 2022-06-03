//Imports
import assert from 'assert'
import { queryCommands } from '../db/databaseCommands';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
// @ts-ignore
import mailer from 'nodemailer';

const capitalRegex = /[A-Z]+/;
const digitRegex = /[1-9]+/;

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
        console.log(authToken);
        if (!authToken) {
            return res.status(401).send({error: "unauthorized", message: "You need to provide authorization for this endpoint!"})
        }
        try {
            res.locals.decodedToken = jwt.verify(authToken, process.env.APP_SECRET || "");
            const expireDate = res.locals.decodedToken.exp;
            console.log(expireDate);
            const currentDate = new Date().getTime()/ 1000;
            console.log(currentDate)
            assert(expireDate > currentDate);
            next()
        } catch (err) {
            return res.send({error: "unauthorized", message: "You need to provide authorization for this endpoint!"})
        }
    }
    ,
    validateEmail:(req: any, res: any, next:any)=>{
        try {
            let emailAddress = req.body.emailAddress;
            assert(emailAddress);
            emailAddress.toLowerCase();
            next();
        }catch (error: any){
            const err = {error: "wrong_input", message: "Empty field"};
            res.status(401).json(err);
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
        const user = await queryCommands.retrieveEmail(req.body.emailAddress);
        if(user){
            //Generates token
            const generateToken = jwt.sign({_id:user._id}, process.env.APP_SECRET || "", {expiresIn: "2h"});
            //Link of password change page
            const link = `${process.env.FRONTEND_URI}/vergeten_wachtwoord/${generateToken}`;
            const info = await transporter.sendMail({
                from: process.env.SMTP_USERNAME,
                to: user.emailAddress,
                subject: `U bent uw wachtwoord vergeten.`,
                text: `Beste meneer/mevrouw ${user.lastName},U hebt aangegeven dat u uw wachtwoord bent vergeten. \nKlik de link hieronder om een nieuw wachtwoord in te voeren.\nLink: ${link}\n\nVriendelijke groeten,\nSkool portaal`
            });
            res.status(200).json({succes: true, res: info});
        } else{
            res.status(401).json({error: "retrieval_failure", message: "user does not exist"});
        }
    }
    ,
    async changeForgottenPassword(req: any, res:any){
        let newPassword = req.body.password;
        const isValid = validatePassword(newPassword);
        let decodedToken = res.locals.decodedToken;
        newPassword = await hashNewPassword(newPassword);
        try {
            assert(isValid);
            // @ts-ignore
            const query = await queryCommands.updatePassword(decodedToken._id, newPassword);
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
            const correctPassword = await checkPassword(loginData.password, getUser.password);
            if (correctPassword) {
                if (getUser.isActive) {
                    jwt.sign({ id: getUser._id, role: getUser.role},
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

async function hashNewPassword(password: string){
    return bcrypt.hash(password, 6);
}

function validatePassword (newPassword:string):boolean  {
    try {
        assert(newPassword.match(digitRegex));
        assert(newPassword.match(capitalRegex));
        assert((newPassword.length > 8));
        return true;
    } catch (err){
        return false;
    }
}
export default loginController;