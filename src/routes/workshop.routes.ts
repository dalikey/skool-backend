import express from 'express';
import workshopController, {getAllWorkshop} from '../controller/workshop.controller';
import {controller} from '../controller/authorization.controller';

const workshopRouter = express.Router();

// workshopRouter.get(
//     '/api/workshop/@me',
//     controller.validateToken,
//     workshopController.getAllWorkshop
// );
//Gets all workshops
workshopRouter.get('/api/workshop',
    controller.validateToken,
    workshopController.getAllWorkshop);


//Creates workshop
workshopRouter.post('/api/workshop/add',
    controller.validateToken,
    controller.validateOwnerRole,
    // workshopController.handleFileInput,
    workshopController.verifyInput,
    workshopController.createWorkshop);

export default workshopRouter;
