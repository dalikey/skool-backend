import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";

chai.should();
chai.use(chaiHttp);

describe('Creation of customer in the database', ()=>{
    describe('Insert failure', ()=> {

    })
    ,
    describe('Insert success', ()=> {

    })
})