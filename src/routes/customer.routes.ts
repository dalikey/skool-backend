import express from "express";
import customerController from "../controller/customer.controller";
import {authorizationMethods, controller} from "../controller/authorization.controller";
const customerRoutes  = express.Router();



//Add customer: TODO: Add customer post
customerRoutes.post('/api/customer',
    controller.validateToken,
    controller.validateOwnerRole,
    customerController.handleFileInput,
    customerController.validateInputCustomer,
    customerController.insertCustomer);

//Deletes customer
customerRoutes.delete('/api/customer/:customerId',
    controller.validateToken,
    controller.validateOwnerRole,
    customerController.deleteCustomer);

//Update customer
customerRoutes.put('/api/customer/:customerId',
    controller.validateToken,
    controller.validateOwnerRole,
    customerController.handleFileInput,
    customerController.validateInputCustomer,
    customerController.updateCustomer);

//Get customer
customerRoutes.get('/api/customer',
    controller.validateToken,
    customerController.getAllCustomers);
//Get one customer
customerRoutes.get('/api/customer/:customerId',
    controller.validateToken,
    customerController.getOneCustomer)


//Test file upload
customerRoutes.put('/api/file', customerController.handleFileInput);

export default customerRoutes;