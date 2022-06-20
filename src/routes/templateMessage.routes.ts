import express from "express";
import templateMessage from '../controller/templateMessage.controller'
import {authorizationMethods, controller} from "../controller/authorization.controller";
import messageController from "../controller/templateMessage.controller";
const messageRouter  = express.Router();

//Inserts new templateMessage
messageRouter.post('/api/templateMessage',
    controller.validateToken,
    controller.validateOwnerRole,
    templateMessage.inputValidation,
    templateMessage.insertTemplate);

//Update template message
messageRouter.put('/api/templateMessage/:templateId/update',
    controller.validateToken,
    controller.validateOwnerRole,
    templateMessage.inputValidation,
    templateMessage.updateTemplate);

//Deletes template message
messageRouter.delete('/api/templateMessage/:templateId/delete',
    controller.validateToken,
    controller.validateOwnerRole,
    templateMessage.deleteTemplate);

//Get all messages
messageRouter.get('/api/templateMessage',
    controller.validateToken,
    controller.validateOwnerRole,
    messageController.getAllTemplates);

messageRouter.post('/api/templateMessage/test', messageController.test);
export default messageRouter;