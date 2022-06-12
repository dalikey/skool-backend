import { Request, Response } from 'express';
import Logger from 'js-logger';
import { ObjectId } from 'mongodb';
import {workshopInsert} from '../models/workshopBody';
import {queryCommands} from '../db/databaseCommands';
import assert from 'assert';

export async function handleFileInput(req:any, res:any, next:any){
    try {
        let imageFile = req.files.image.data;
        req.body.logo = imageFile.toString('base64');
        next();
    }catch (e) {
        return res.status(400).json({error: "file_upload_failure", message: "Wrong file insert"});
    }
}

export async function verifyInput(req: Request, res: Response, next: any) {
    const newWorkshop= req.body;
    try {
        assert(typeof newWorkshop.name === 'string');
        assert(typeof newWorkshop.content === 'string');
        //assert(newWorkshop.materials);
        next();
    } catch (err) {
        return res.status(400).send({
            error: 'input_invalid',
            message: 'Fields are empty',
        });
    }
}

export async function getAllWorkshop(req: Request, res: Response) {
    const mongoQuery = {};
    for (let key in req.query) {
        if (["isActive", "name"].includes(key)) {
            if (req.query[key] === 'true') {
                // @ts-ignore
                mongoQuery[key] = true
            } else if (req.query[key] === 'false') {
                // @ts-ignore
                mongoQuery[key] = false;
            } else if (req.query[key] === 'null') {
                // @ts-ignore
                mongoQuery[key] = {'$exists': false};
            } else {
                // @ts-ignore
                mongoQuery[key] = `${req.query[key]}`;
            }
        }
    }
    try {
        const workshop = await queryCommands.getAllWorkshops(mongoQuery);
        res.status(200).send({ result: workshop });
    }catch (e) {
        res.status(400).send({ error:"data_retrieval_failure", message: "get all workshop failed to retrieve" });
    }

}


export async function createWorkshop(req: Request, res: Response) {
    //Initialize workshop(activity)
    const newWorkshop = req.body;
    const work: workshopInsert = {name: newWorkshop.name, content: newWorkshop.content, materials: newWorkshop.materials, isActive: true};
    //Database command
    const insert = await queryCommands.createWorkshop(work);

    res.status(201).send({ message: "Workshop successfully created."});
}

export async function deleteWorkshop(req: Request, res: Response){
    const workshopId = req.params.workshopId;
    await queryCommands.deleteWorkshop(workshopId);
    res.status(200).send({message: "Deletion has completed"});
}

export async function updateWorkshop(req: Request, res: Response){
    const workshopId = req.params.workshopId;
    const newWorkshop = req.body;

}
export default {
    verifyInput,
    getAllWorkshop,
    createWorkshop,
    deleteWorkshop,
    updateWorkshop
};
