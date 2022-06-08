import express from 'express';
import workshopController from '../controller/workshop.controller';
import {controller} from '../controller/authorization.controller';

const workshopRouter = express.Router();

workshopRouter.get(
    '/api/workshop/@me',
    controller.validateToken,
    workshopController.getWorkshop
);


//Creates workshop
workshopRouter.post('/api/workshop/add',
    controller.validateToken,
    controller.validateOwnerRole,
    // workshopController.handleFileInput,
    workshopController.verifyInput,
    workshopController.createWorkshop);

export default workshopRouter;
