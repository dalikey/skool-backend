import jwt from "jsonwebtoken";
import assert from "assert";
import bcrypt from "bcrypt";
const capitalRegex = /[A-Z]+/;
const digitRegex = /[1-9]+/;

export const controller = {
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
}
