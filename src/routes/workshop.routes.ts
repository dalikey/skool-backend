import express from 'express';
import workshopController from '../controller/workshop.controller';
const workshopRouter = express.Router();

workshopRouter.get(
    '/api/workshop/@me',
    workshopController.authorizeWorkshop,
    workshopController.getWorkshop
);

workshopRouter.post(
    '/api/workshop/:workshopId/activate',
    workshopController.authorizeWorkshop,
    workshopController.activateWorkshop
);

workshopRouter.post(
    '/api/workshop/:workshopId/deactivate',
    workshopController.authorizeWorkshop,
    workshopController.deactivateWorkshop
);

workshopRouter.get(
    '/api/workshop',
    workshopController.authorizeWorkshop,
    workshopController.getWorkshops
);

workshopRouter.post('/api/workshop', workshopController.createWorkshop);

export default workshopRouter;
