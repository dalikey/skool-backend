import {authorizationMethods, controller} from "../controller/authorization.controller";
import ShiftController from "../controller/WorkshopShift.controller";
import express from "express";
const ShiftRoutes = express();

//Creates shift
ShiftRoutes.post('api/workshop/shift',
    controller.validateToken,
    ShiftController.validateWorkshopShiftInput,
    ShiftController.insertShift)
//Update shift
//Deletes shift
//Retrieve shifts
//Retrieve one shift

export default  ShiftRoutes;