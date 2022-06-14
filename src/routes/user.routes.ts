import express from "express";
import userController from "../controller/user.controller";
import {authorizationMethods, controller} from "../controller/authorization.controller";
const userRouter  = express.Router();

userRouter.get('/api/user/@me',
    controller.validateToken,
    userController.getUser,
);

userRouter.get('/api/user/:userId',
    controller.validateToken,
    userController.getUser)

userRouter.post('/api/user/:userId/activate',
    controller.validateToken,
    userController.activateUser
);

userRouter.post('/api/user/:userId/deactivate',
    controller.validateToken,
    userController.deactivateUser
);


userRouter.get('/api/user',
    controller.validateToken,
    userController.getUsers
);

userRouter.put('/api/user/:userId',
    controller.validateToken,
    userController.editUser
);

userRouter.delete('/api/user/:userId',
    controller.validateToken,
    userController.deleteUser)


export default userRouter;