import {authorizationMethods, controller} from "../controller/authorization.controller";
import express from "express";
const enrollRoutes = express();
import enrollController from '../controller/enrollment.controller';

enrollRoutes.post('/api/workshop/shift/:shiftId/enroll' ,
    controller.validateToken,
    enrollController.checkExistenceShift,
    enrollController.checkEnrollDate,
    enrollController.enrollToShift)

export default enrollRoutes;