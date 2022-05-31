import express from "express";
import registrationController from "../controller/registration.controller";
const registrationRouter  = express.Router();

registrationRouter.post('/api/auth/register',
registrationController.verifyInput,
registrationController.hashPassword,
registrationController.registerUser
);


export default registrationRouter;