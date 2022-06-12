import express from "express";
import loginController from "../controller/login.controller";
const loginRouter  = express.Router();

loginRouter.post('/api/auth/login',
loginController.validateInput,
loginController.userLogin);

loginRouter.post('/api/auth/login/forgot', loginController.validateEmail, loginController.sendNewPasswordLink);
loginRouter.put('/api/auth/login/password', loginController.validateToken, loginController.validatePasswords, loginController.changeForgottenPassword);

// @ts-ignore
export default loginRouter;