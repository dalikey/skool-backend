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

    async test(req:any, res:any){
        try {
            let imageFile = req.files.image.data;
            let url:string = imageFile.toString('base64');
            await mailMethods.sendMail("Test bericht met css", templateFormat.formatMail(`<div><p>Test deze mail</p></div>`), "Xin20Wang@outlook.com");
            return res.status(200).json({message: url});
        }catch (e) {
            return res.status(400).json({error: "file_upload_failure", message: "Wrong file insert"});
        }
    },
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
                    html: templateFormat.formatMail(content)
                });
            } catch (e){
                return e;
            }
        }
    }

export const templateFormat = {
    formatMail(content: string){
        return `${this.getStyleSheet()}
                    ${this.setUpBody(content)}`;
    },

    getLogo(){
        let base64Logo = "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";
        return `<div><img class="logo" src="data:image/png;base64, ${base64Logo}", alt="skoolWorkshoplogo"></div>`
    }
    ,
    setUpBody(content:string){
        let body = `<body> 
                        <div class="innerBody">
                            ${this.getLogo()}
                            ${content}
                            ${this.getContactData()}
                        </div>
                    </body>`;
        return body;
    },

    getContactData(){
        let contact =
            `<div>
                <p>Telefoonnummer: +31 (0)85-065 039 23<br/>Whatsapp: +31 (0)6-28 31 88 42<br/>
                E-Mail: <a href="mailto:info@skoolworkshop.nl">info@skoolworkshop.nl</a><br/>
                Website: <a href="https://skoolworkshop.nl/">www.skoolworkshop.nl</a><br/>
                </p>
               
                <h3>Volg ons op social media:</h3>
                <p>
                    <a href="https://www.facebook.com/skoolworkshop">www.facebook.com/skoolworkshop</a><br/>
                    <a href="https://www.instagram.com/skoolworkshop/">www.instagram.com/skoolworkshop</a><br/> 
                <p>
               
            </div>`;
        return contact;
    },

    getStyleSheet(){
        let css = `<head>
                        <style>
                            body {
                                background-color: orange;
                                margin: auto 3em;
                            }
                            h1   {
                                size: 4em;
                                padding: 1em;
                            }
                            h2   {
                                size: 3em;
                                padding: 1em;
                            }
                            h3   {
                                size: 2em;
                                padding: 1em;
                            }
                     
                            p    {
                                size: 1em;
                                padding: 20px;
                            }
                            .logo {
                                text-align: center;
                                padding: 1em;
                            }
                            .innerBody {
                                background-color: white;
                                margin: 50px;
                            }
                            table{
                                border: grey 1px solid;
                            }
                            th{
                                background-color: orange;
                                color: white;
                                padding: 15px;
                                margin: 15px;
                            }
                            td{
                                background-color: white;
                                padding: 15px;
                                margin: 15px;
                            }
                        </style>
                    </head>`
        return css;
    },

    getTableOfShiftInfo(klant:string, datum:string, tijd:string, naam:string, functie:string, shiftId:string, hostname:string, userId:string, token:string){
        let table = `<div>
                        <table>
                            <tr>
                                <th>Klant</th>
                                <td col="2">${klant}</td>
                            </tr>
                            <tr>
                                <th>Datum en tijd</th>
                                <td col="2">${datum}<br/>${tijd}</td>
                            </tr>
                            <tr>
                                <th>Naam uitgenodigde</th>
                                <td col="2">${naam}</td>
                            </tr>
                            <tr>
                                <th>Functie</th>
                                <td col="2">${functie}</td>
                            </tr>
                            <tr>
                                <th>Inschrijving</th>
                                <td>
                                    <a href="${hostname}/api/workshop/shift/${shiftId}/accepted/${userId}/enroll/${token}/invitation">
                                        ${hostname}/api/workshop/shift/${shiftId}/accepted/${userId}/enroll/${token}/invitation
                                    </a>
                                </td>
                                <td>
                                    <a href="${hostname}/api/workshop/shift/${shiftId}/enroll/${userId}/reject/${token}/no">
                                        ${hostname}/api/workshop/shift/${shiftId}/enroll/${userId}/reject/${token}/no
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </div>`;
        return table;
    }

}
export default messageController;