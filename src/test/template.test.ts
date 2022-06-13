import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import dot from 'dotenv';
import {ObjectId} from "mongodb";
dot.config();

// describe('Template creation', ()=>{
//
// })
//
// describe('Template update', ()=>{
//
// })
// describe('Template deletion', ()=>{
//
// })