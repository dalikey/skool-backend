import {queryCommands} from '../db/databaseCommands';
import assert from "assert";
import fs from 'fs';
import {Binary} from "mongodb";
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
//Regex for phones - every phonenumber must start with 06 or 31 and has either a space sign, - or nothing in between, and then 9 digits
const phoneRegex = /(06)(\s|\-|)\d{8}|31(\s6|\-6|6)\d{8}/;

const customerController = {
    validateInputCustomer:(req:any, res:any, next:any)=>{
        const customer = req.body;
        try {
            assert(customer);
            assert(customer.location);
            assert(customer.contact);
            //Customer
            assert(typeof customer.name == 'string');
            assert(typeof  customer.logo == 'string');
            //Contact info
            assert(typeof customer.contact.emailAddress == 'string');
            assert(typeof customer.contact.phoneNumber == 'string');
            assert(customer.emailAddress.toLowerCase().match(emailRegex));
            assert(customer.phoneNumber.match(phoneRegex));
            //Location
            assert(typeof customer.location.street_houseNr == 'string');
            assert(typeof customer.location.postalcode == 'string');
            assert(typeof customer.location.city == 'string');
            assert(typeof customer.location.country == 'string');
        } catch (e){
            return res.status(400).json({error: "input_error", message: "Wrong input"});
        }
    }
    ,
    async insertCustomer(req:any, res:any){
        //Initiate variabels
        const customer = req.body;
        //Convert image to base64 string
        customer.logo = convertIntoBase64(customer.logo);
        //Database command.
        const insert = await queryCommands.insertCustomer(customer);
        res.status(200).json({
            message: "Customer inserted",
        })
    }
    ,
    async deleteCustomer(req:any, res:any){
        //Initiate variabels
        const customer = req.body;
        //Delete command
        const deletion = await queryCommands.deleteCustomer(customer._id);
        if(deletion.deletedCount == 1){
            res.status(200).json({
                message: "Customer deleted",
            })
        } else{
            res.status(404).json({
                message: "Customer does not exist",
            })
        }

    }
    ,
    async updateCustomer(req: any, res: any){
        //Initiate variabels
        const customer = req.body;
        //Convert image to base64 string
        customer.logo = convertIntoBase64(customer.logo);
        //Updates customer
        const update = await queryCommands.updateCustomer(customer._id, customer);
        res.status(200).json({message: "update completed"});
    }
    ,
    async getAllCustomers(req:any, res:any){
        const customers = await queryCommands.getAllCustomers();
        res.status(200).json({result: customers});
    }
    ,
    async getOneCustomer(req:any, res:any){
        const customer = req.body;
        const customerOne = await queryCommands.getOneCustomer(customer._id);
        res.status(200).json({result: customerOne});
    }
}

function convertIntoBase64(url: string) {
    let bitmap = fs.readFileSync(url);
    return new Buffer(bitmap).toString('base64');
}

function decodeBase64(base64String: string) {
    let data = base64String;
    let buff = new Buffer(data, 'base64');
    let text = buff.toString('ascii');
    return text
}
export default customerController;