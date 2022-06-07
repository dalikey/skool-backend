// @ts-ignore
import {queryCommands} from '../db/databaseCommands';
import assert from "assert";
import {Binary} from "mongodb";

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
//Regex for phones - every phonenumber must start with 06 or 31 and has either a space sign, - or nothing in between, and then 9 digits
const phoneRegex = /(06)(\s|\-|)\d{8}|31(\s6|\-6|6)\d{8}/;
//Regex for passwords - at least one lowercase character, at least one UPPERCASE character, at least one digit and at least 8 characters long
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
const controller = {
    validateInputCustomer:(req:any, res:any, next:any)=>{
        const customer = req.body;
        try {
            assert(customer);
            assert(customer.location);
            //Customer
            assert(typeof customer.name == 'string');
            assert(typeof customer.emailAddress == 'string');
            assert(typeof customer.phoneNumber == 'string');
            assert(customer.emailAddress.toLowerCase().match(emailRegex));
            assert(customer.phoneNumber.match(phoneRegex));
            //TODO: Image url checken
            //Location fields
            assert(typeof customer.location.street == 'string');
            assert(typeof customer.location.postalcode == 'string');
            assert(typeof customer.location.houseNr == 'string');
            assert(typeof customer.location.country == 'string');
        } catch (e){
            next(res.status(400).json({error: "input_error", message: "Wrong input"}))
        }
    }
    ,
    insertCustomer:(req:any, res:any)=>{
        //Initiate variabels
        const customer = req.body;
        //TODO: Convert image to something

        //Database command.
        const insert = queryCommands.insertCustomer(customer);
        res.status(200).json({
            message: "Customer inserted",
            dataResult: insert
        })
    }
}

export default controller;