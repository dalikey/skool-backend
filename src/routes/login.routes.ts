import express from "express";
import loginController from "../controller/login.controller";
const loginRouter  = express.Router();

loginRouter.post('/api/auth/login',
loginController.validateInput,
loginController.userLogin);


export default loginRouter;