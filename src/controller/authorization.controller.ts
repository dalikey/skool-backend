import jwt from "jsonwebtoken";
import assert from "assert";
import bcrypt from "bcrypt";
const capitalRegex = /[A-Z]+/;
const digitRegex = /[1-9]+/;

export const controller = {
    //Validates every endpoint on token
    validateToken: (req: any, res: any, next: any) => {
        const authToken = req.headers.authorization || "";
        if (!authToken) {
            return res.status(401).send({
                error: "unauthorized",
                message: "You need to provide authorization for this endpoint!"
            })
        }
        try {
            res.locals.decodedToken = jwt.verify(authToken, process.env.APP_SECRET || "");
            next()
        } catch (err) {
            return res.send({error: "unauthorized", message: "You need to provide authorization for this endpoint!"})
        }
    }
    ,
    validateOwnerRole:(req: any, res:any, next:any)=>{
        const decodedToken = res.locals.decodedToken;
        try {
            assert(decodedToken.role == 'owner');
            next();
        }catch (e) {
            return res.status(401).send({error: "unauthorized", message: "You do not have the right authority."});
        }
    }
    ,
    validateAdminRole:(req:any, res:any, next:any)=>{
        const decodedToken = res.locals.decodedToken;
        try {
            assert(decodedToken.role != 'user');
            next();
        }catch (e) {
            return res.status(401).send({error: "unauthorized", message: "You do not have the right authority."});
        }
    }
}

export const authorizationMethods = {
    async hashNewPassword(password: string){
        return bcrypt.hash(password, 6);
    }
    ,
    validatePassword:(newPassword:string):boolean => {
        try {
            assert(newPassword.match(digitRegex));
            assert(newPassword.match(capitalRegex));
            assert((newPassword.length >= 8));
            return true;
        } catch (err){
            return false;
        }
    }
    ,
    async checkPassword(password: string, queryResultPassword: string,) {
        return bcrypt.compare(password, queryResultPassword)
            .then(isCorrect => {
            return isCorrect;
        })
    }
    ,
    generateRandomSecretKey(){
        let token:string = "";
        let randomLenght = Math.random() * 70;
        for (let i = 0; i < randomLenght; i++) {
            let asciiValue = Math.random() * 254;
            let letter = String.fromCharCode(asciiValue);
            token += letter;
        }
        return token;
    }
    ,
    equalPasswords(newPassword:string, confirmedPassword:string){
        return (newPassword == confirmedPassword);
    }
}
