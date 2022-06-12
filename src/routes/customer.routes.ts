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
customerRoutes.delete('/api/customer/:customerId/delete',
    controller.validateToken,
    controller.validateOwnerRole,
    customerController.deleteCustomer);

//Update customer
customerRoutes.put('/api/customer/:customerId/update',
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
customerRoutes.get('/api/customer/:customerId/getOne',
    controller.validateToken,
    customerController.getOneCustomer)


//Test file upload
customerRoutes.put('/api/file', customerController.test);

export default customerRoutes;