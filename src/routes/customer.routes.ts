import express from "express";
import customerController from "../controller/customer.controller";
import {authorizationMethods, controller} from "../controller/authorization.controller";
const customerRoutes  = express.Router();

customerRoutes.post('/api/customer',
    controller.validateToken,
    controller.validateOwnerRole,
    customerController.handleFileInput,
    customerController.validateInputCustomer,
    customerController.insertCustomer);

//Deletes customer
//TODO Test need to be made
customerRoutes.delete('/api/customer/:customerId',
    controller.validateToken,
    controller.validateOwnerRole,
    customerController.deleteCustomer);

//Update customer
//TODO Test need to be made
customerRoutes.put('/api/customer/:customerId',
    controller.validateToken,
    controller.validateOwnerRole,
    customerController.handleFileInput,
    customerController.validateInputCustomer,
    customerController.updateCustomer);

//Get customer
//TODO Test need to be made
customerRoutes.get('/api/customer',
    controller.validateToken,
    customerController.getAllCustomers);

//Get one customer
//TODO Test need to be made
customerRoutes.get('/api/customer/:customerId',
    controller.validateToken,
    customerController.getOneCustomer)


//Test file upload
customerRoutes.put('/api/file', customerController.test);

export default customerRoutes;