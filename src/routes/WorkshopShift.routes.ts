import {authorizationMethods, controller} from "../controller/authorization.controller";
import ShiftController from "../controller/WorkshopShift.controller";
import express from "express";
const ShiftRoutes = express();

//Creates shift
ShiftRoutes.post('api/workshop/shift',
    controller.validateToken,
    controller.validateAdminRole,
    ShiftController.validateWorkshopShiftInput,
    ShiftController.insertShift)

//Update shift
ShiftRoutes.get('/api/workshop/shift/:shiftId',
    controller.validateToken,
    controller.validateAdminRole,
    ShiftController.validateWorkshopShiftInput,
    ShiftController.updateShift);

//Deletes shift
ShiftRoutes.get('/api/workshop/shift/:shiftId',
    controller.validateToken,
    controller.validateAdminRole,
    ShiftController.deleteShift);

//Retrieve shifts
ShiftRoutes.get('/api/workshop/shift',
    controller.validateToken,
    ShiftController.getAllShifts);

//Retrieve one shift
ShiftRoutes.get('/api/workshop/shift/:shiftId',
    controller.validateToken,
    ShiftController.getOneShift);

export default  ShiftRoutes;