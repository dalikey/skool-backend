import {queryCommands} from '../db/databaseCommands';
import assert from "assert";
import {triggers, triggerValues} from "../models/templateMessageBody";
import nodemailer, {Transporter} from "nodemailer";
import dotEnv from 'dotenv'
dotEnv.config();
let transporter: Transporter;

if (process.env.SMTP_SERVER) {
    transporter = nodemailer.createTransport({
        service: process.env.SMTP_PROVIDER,
        // host: process.env.SMTP_SERVER,
        // port: 465,
        // secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USERNAME, // generated ethereal user
            pass: process.env.SMTP_PASSWORD, // generated ethereal password
        },
    });
}
let messageController = {

    async testMail(req: any, res: any){
        const template = await mailMethods.retrieveMailTemplate(triggerValues.registrationAccept);
        console.log(template);
        if (template) {
            let  html = template.content;
            const result = await mailMethods.sendMail("No step back", html, "Xin20Wang@outlook.com");
            console.log(result);
            res.status(200).json({result: html});
        } else{
            res.status(400).json({error: "Error"});
        }
    },

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
export const mailMethods =
    {
        async retrieveMailTemplate(triggerValue:string){
            try {
                return queryCommands.getOneTemplate(triggerValue);
            }catch (e) {
                return null;
            }

        },
        async sendMail(title: string, content:string , emailAddress:string){
            try {
                // create reusable transporter object using the default SMTP transport
                return await transporter.sendMail({
                    from: process.env.SMTP_USERNAME,
                    to: emailAddress,
                    subject: title,
                    html: content
                });
            } catch (e){
                return e;
            }
        }
    }
export default messageController;