import express from "express";
import templateMessage from '../controller/templateMessage.controller'
import {authorizationMethods, controller} from "../controller/authorization.controller";
import messageController from "../controller/templateMessage.controller";
const messageRouter  = express.Router();

//Inserts new templateMessage - NEEDS TO BE TESTED
messageRouter.post('/api/template',
    controller.validateToken,
    controller.validateOwnerRole,
    templateMessage.inputValidation,
    templateMessage.insertTemplate)

//Update template message - NEEDS TO BE TESTED
messageRouter.put('/api/template/:templateId',
    controller.validateToken,
    controller.validateOwnerRole,
    templateMessage.inputValidation,
    templateMessage.updateTemplate);

//Deletes template message - NEEDS TO BE TESTED
messageRouter.delete('/api/template/:templateId', controller.validateToken, controller.validateOwnerRole, templateMessage.deleteTemplate);

//Get all messages - NEEDS TO BE TESTED
messageRouter.get('/api/template', controller.validateToken, controller.validateOwnerRole, messageController.getAllTemplates);
export default messageRouter;