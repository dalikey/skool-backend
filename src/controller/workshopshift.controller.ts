import {queryCommands} from "../db/databaseCommands";
import assert from "assert";
import {WorkshopShiftBody} from "../models/workshopShiftBody";
import {ObjectId} from "mongodb";
import time, {DateTime, Duration} from 'luxon';

let controller = {
    validateWorkshopShiftInput:(req:any, res:any, next:any)=>{
        const workshopShift = req.body;
        let breakT = 0;
        try {
            assert(workshopShift);
            assert(workshopShift.workshopId);
            assert(workshopShift.clientId);
            //Locatie van de workshopshift is optioneel.
            assert(typeof workshopShift.workshopId == 'string');
            assert(typeof workshopShift.function == 'string');
            assert(typeof workshopShift.maximumParticipants == "number");
            assert(typeof workshopShift.targetAudience == 'string');
            assert(typeof workshopShift.level == 'string');
            assert(workshopShift.location);
            assert(workshopShift.date);
            assert(workshopShift.availableUntil);
            //Shift time and breaks
            assert(workshopShift.startTime);
            assert(workshopShift.endTime);
            assert((workshopShift.hourRate && !workshopShift.dayRate)|| (workshopShift.dayRate && !workshopShift.hourRate));
            //assert(workshopShift.breakTimeInMinutes); Is optioneel, als clinten een dagtarief invoert.

            next();
        }catch (e){
            return res.status(400).json({error: "input_error", message: "Input is wrong"});
        }
    }
    ,
    insertShift:(req:any, res:any, next:any)=>{
        //Initialize variables
        const workshopShift = req.body;
        let totalTariff;
        let hasBreaks = false;
        let formOfTime;
        //Database command
        // @ts-ignore
        const isHourRate = decideFormOfRate(workshopShift.hourRate);
        if(isHourRate){
           totalTariff = calculateFullRate(workshopShift.startTime, workshopShift.endTime, workshopShift.breakTimeInMinutes,workshopShift.hourRate);
           formOfTime = "per uur";
           delete workshopShift.dayRate;
        } else{
            totalTariff = workshopShift.dayRate;
            formOfTime = "per dag";
            delete workshopShift.hourRate;
        }

        if(workshopShift.breakTimeInMinutes || workshopShift.breakTimeInMinutes == 0){
            hasBreaks = true;
        }

        workshopShift.workshopId = new ObjectId(workshopShift.workshopId);
        workshopShift.clientId = new ObjectId(workshopShift.clientId);
        workshopShift.tarriff =  totalTariff;
        workshopShift.formOfTime = formOfTime;
        workshopShift.hasBreaks= hasBreaks;
        workshopShift.date = DateTime.fromISO(workshopShift.date);
        workshopShift.availableUntil = DateTime.fromISO(workshopShift.availableUntil);
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


function calculateFullRate(startTime:string, endTime:string, hourRate: number, minutesOfBreak:number) {
    let start  = DateTime.fromISO(startTime);
    let end = DateTime.fromISO(endTime);
    let durationInHours = end.diff(start, 'hours');
    let breakTimeInHours = minutesOfBreak / 60;
    // @ts-ignore
    let paidTime = durationInHours.toObject().hours - breakTimeInHours;
    return paidTime * hourRate;
}

function decideFormOfRate(hourRate: number) {
    return !!hourRate;

}

export default controller;