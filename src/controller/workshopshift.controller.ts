import {queryCommands} from "../db/databaseCommands";
import {assign} from "nodemailer/lib/shared";
import assert from "assert";

let controller = {
    validateWorkshopShiftInput:(req:any, res:any, next:any)=>{
        const workshopShift = req.body;
        try {
            assert(workshopShift);
            assert(workshopShift.workshopId);
            assert(workshopShift.clientId);
            //Locatie van de workshopshift is optioneel.
            assert(typeof workshopShift.customerId == 'string');
            assert(typeof workshopShift.workshopId == 'string');
            assert(typeof workshopShift.function == 'string');
            assert(typeof workshopShift.maximumParticipants == "number");
            assert(typeof workshopShift.targetAudience == 'string');
            assert(typeof workshopShift.level == 'string');
            assert(workshopShift.location);
            assert(workshopShift.date);
            assert(workshopShift.availableUntil);
            assert(workshopShift.hasBreaks);
            //TODO shifts toevoegen

            next();
        }catch (e){
            return res.status(400).json({error: "input_error", message: "Input is wrong"});
        }
    }
    ,
    insertShift:(req:any, res:any, next:any)=>{
        //Initialize variables
        const workshopShift = req.body;
        //Database command
        const insert = queryCommands.insertOneWorkshopShift(workshopShift);
        //Sends status back
        res.status(200).json({message: "shift added"});
    }
    ,
    async getAllShifts(req:any, res:any){
        //Database command
        const resultSet = await queryCommands.getAllShifts();
        //Sends status back
        res.status(200).json({result: resultSet});
    }
    ,
    async getOneShift(req:any, res:any){
        const shiftId = req.params.shiftId;
        const shift = queryCommands.getOneShift(shiftId);
        if(shift){
            res.status(200).json({result:shift});
        } else {
            res.status(404).json({error: "retrieval_failure" , message: "shift does not exist."})
        }
    }
    ,

    async updateShift(req:any, res: any){
        //Initialise variables
        const shiftId = req.params.shiftId;
        const shift = req.body;
        //Database commands
        const update = await queryCommands.updateShift(shiftId, shift);
        if(update){
            res.status(200).json({message: "Update successfull"});
        }else{
            res.status(401).json({error: "update_failure" ,message: "Update failed"});
        }

    }
    ,
    async deleteShift(req:any, res:any){
        const shiftId = req.params.shiftId;
        await queryCommands.deleteShift(shiftId);
        res.status(200).json({message: "Successful deletion"});
    }
}

export default controller;