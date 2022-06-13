import {authorizationMethods, controller} from "../controller/authorization.controller";
import ShiftController from "../controller/workshopshift.controller";
import express from "express";
const ShiftRoutes = express();

//Creates shift
ShiftRoutes.post('/api/workshop/shift',
    controller.validateToken,
    controller.validateAdminRole,
    ShiftController.validateWorkshopShiftInput,
    ShiftController.insertShift)

//TODO Tests need to be written
//Update shift
ShiftRoutes.put('/api/workshop/shift/:shiftId/update',
    controller.validateToken,
    controller.validateAdminRole,
    ShiftController.validateWorkshopShiftInput,
    ShiftController.updateShift);

//TODO Tests need to be written
//Deletes shift
ShiftRoutes.delete('/api/workshop/shift/:shiftId/delete',
    controller.validateToken,
    controller.validateAdminRole,
    ShiftController.deleteShift);

//Retrieve shifts
ShiftRoutes.get('/api/workshop/shift',
    controller.validateToken,
    ShiftController.getAllShifts);

//Retrieve shifts, by the admin and owner
ShiftRoutes.get('/api/workshop/shift/admin',
    controller.validateToken,
    controller.validateAdminRole,
    ShiftController.getAllShiftsForAdmin);

//Retrieve one shift
ShiftRoutes.get('/api/workshop/shift/:shiftId/single',
    controller.validateToken,
    ShiftController.getOneShift);

export default  ShiftRoutes;