import express from "express";
import customerController from "../controller/customer.controller";
import {authorizationMethods, controller} from "../controller/authorization.controller";
const customerRoutes  = express.Router();


//Add customer: TODO: Add customer post
customerRoutes.post('/api/customer',
    controller.validateToken,
    controller.validateOwnerStatus,
    customerController.validateInputCustomer,
    customerController.insertCustomer);
//Deletes customer
//Update customer
//Get customer
//Get one customer


export default customerRoutes;