import express from 'express';
import workshopController from '../controller/workshop.controller';
import { controller } from '../controller/authorization.controller';

const workshopRouter = express.Router();

// workshopRouter.get(
//     '/api/workshop/@me',
//     controller.validateToken,
//     workshopController.getAllWorkshop
// );

//Gets all workshops
workshopRouter.get(
    '/api/workshop',
    controller.validateToken,
    workshopController.getAllWorkshop
);

//Creates workshop
workshopRouter.post(
    '/api/workshop/add',
    controller.validateToken,
    controller.validateOwnerRole,
    // workshopController.handleFileInput,
    workshopController.verifyInput,
    workshopController.createWorkshop
);

//Update workshop - need to be tested.
workshopRouter.put(
    '/api/workshop/:workshopId/update',
    controller.validateToken,
    workshopController.updateWorkshop
);

//Deletes workshop - need to be tested.
workshopRouter.delete(
    '/api/workshop/:workshopId',
    controller.validateToken,
    workshopController.deleteWorkshop
);

export default workshopRouter;
