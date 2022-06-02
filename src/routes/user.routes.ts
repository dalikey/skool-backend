import express from "express";
import userController from "../controller/user.controller";
const userRouter  = express.Router();

userRouter.get('/api/user/@me',
    userController.authorizeUser,
    userController.getUser,
);

userRouter.post('/api/user/:userId/activate',
    userController.authorizeUser,
    userController.activateUser
);

userRouter.post('/api/user/:userId/deactivate',
    userController.authorizeUser,
    userController.deactivateUser
);


userRouter.get('/api/user',
    userController.authorizeUser,
    userController.getUsers)


export default userRouter;