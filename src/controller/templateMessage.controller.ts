
import {Request, Response} from 'express';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import Logger from "js-logger";
import { ObjectId } from "mongodb";
import nodemailer, {Transporter} from 'nodemailer';
import {User, userBody} from "../models/userBody";
import assert from "assert";
import {authorizationMethods} from "./authorization.controller";
import {capitalRegex, digitRegex} from "./registration.controller";
import fileUpload from "express-fileupload";
import {triggers} from "../models/templateMessageBody";

let messageController = {
    inputValidation: (req: any, res: any, next:any)=>{
        const template = req.body;
        const triggerList = triggers;
        try {
            assert(template.title, "Title is missing");
            assert(template.content,  "Content is missing");
            assert(template.trigger,  "Trigger is missing");
            assert(triggerList.includes(template.trigger), "Invalid trigger");
            next();
        }  catch (e:any){
            res.status(400).json({error: "input_template_message_error", message: e.message })
        }
    },
    //Inserts new template message
    async insertTemplate(req:any, res:any){
        const template = req.body;
        const insertBody= {
            title: template.title,
            content: template.content,
            trigger: template.trigger
        };
        try {
            const aa = await queryCommands.insertTemplateMessage(insertBody, insertBody.trigger);
            res.status(200).json({message: "Insert template succeeded"});
        }catch (e) {
            res.status(400).json({error: "insert_failure", message: "insert could not"})
        }
    },
    async updateTemplate(req:any, res:any){
        const templateId = req.params.templateId;
        const templateBody = req.body;
        const template = {
            title: templateBody.title,
            content: templateBody.content,
            trigger: templateBody.trigger
        }
        try {
            const getUpdatedTemplate = await queryCommands.updateTemplate(template, templateId);
            res.status(200).json({message: "update_completed", result: getUpdatedTemplate.value});
        }catch (e:any) {
            res.status(400).json({error: "update_failure", message: e})
        }
    },
    async deleteTemplate(req:any, res:any){
        const templateId = req.params.templateId;
        try {
            const getAllTemplates = await queryCommands.deleteTemplate(templateId);
            res.status(200).json({result: getAllTemplates, rows: triggers});
        }catch (e) {
            res.status(400).json({error: "retrieval_failure", message: "template retrieval has failed."})
        }
    },
    async getAllTemplates(req:any, res:any){
        try {
            const getAllTemplates = await queryCommands.getAllTemplates();
            res.status(200).json({result: getAllTemplates, rows: triggers});
        }catch (e) {
            res.status(400).json({error: "retrieval_failure", message: "template retrieval has failed."})
        }
    }
}

export default messageController;