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
            assert(typeof workshopShift.extraInfo == 'string');
            assert(workshopShift.location);
            assert(workshopShift.date);
            assert(workshopShift.availableUntil);
            //Shift time and breaks
            assert(workshopShift.timestamps.length > 0);
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
        // const resultshift = formatWorkShopShift(workshopShift);
        let totalTariff;
        //let hasBreaks = false;
        let formOfTime;
        //
        let duration = getHoursFromTimeStampList(workshopShift.timestamps);
        //Database command
        // @ts-ignore
        const isHourRate = decideFormOfRate(workshopShift.hourRate);
        if(isHourRate){
           totalTariff = calculateFullRate(duration, workshopShift.hourRate);
           formOfTime = "per uur";
           delete workshopShift.dayRate;
        } else{
            totalTariff = workshopShift.dayRate;
            formOfTime = "per dag";
            delete workshopShift.hourRate;
        }
        workshopShift.workshopId = new ObjectId(workshopShift.workshopId);
        workshopShift.clientId = new ObjectId(workshopShift.clientId);
        workshopShift.tarriff =  totalTariff;
        workshopShift.formOfTime = formOfTime;
        // workshopShift.hasBreaks= hasBreaks;
        workshopShift.date = DateTime.fromISO(workshopShift.date);
        workshopShift.availableUntil = DateTime.fromISO(workshopShift.availableUntil);
        workshopShift.participants = [];
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

function calculateFullRate(hoursWork: number, hourRate: number) {
    return hoursWork * hourRate;
}

function decideFormOfRate(hourRate: number) {
    return !!hourRate;

}

function getHoursFromTimeStampList(timeStampsList: any){
    let hours = 0;
    for (const timeObject of timeStampsList) {
        let start  =DateTime.fromISO(timeObject.startTime);
        let end = DateTime.fromISO(timeObject.endTime);
        let difference = end.diff(start, 'hours').toObject();
        let durationHours = difference.hours;
        // @ts-ignore
        hours += durationHours;
    }
    return hours;
}

export default controller;