import {queryCommands} from "../db/databaseCommands";
import assert from "assert";
import {WorkshopShiftBody} from "../models/workshopShiftBody";
import {ObjectId} from "mongodb";
import {DateTime} from 'luxon';
import logger from 'js-logger'
import {Request, Response} from "express";

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
            assert(typeof workshopShift.maximumParticipants == "number");
            assert(typeof workshopShift.targetAudience == 'string');
            assert(typeof workshopShift.level == 'string');
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
    async insertShift(req:any, res:any){
        //Initialize variables
        const workshopShift = req.body;
        const resultshift = shiftFormat(workshopShift);
        const insert = await queryCommands.insertOneWorkshopShift(resultshift);
        //Sends status back
        res.status(200).json({message: "shift added"});
    },

    async getEnrolledShifts(req: Request, res: Response) {
        const userId = res.locals.decodedToken.id;
        logger.info(userId)
        const resultSet = await queryCommands.getAllEnrolledShifts(new ObjectId(userId));
        for(let i = 0; i< resultSet.length; i++) {
            resultSet[i].client = resultSet[i].client[0];
            resultSet[i].workshop = resultSet[i].workshop[0];
            delete resultSet[i].clientId;
            delete resultSet[i].workshopId;
        }
        return res.send({result: resultSet})
    }

    ,
    async getAllShifts(req:any, res:any){
        try {
            const userId = res.locals.decodedToken;
            let queryFilters = [];
            //Gets user
            logger.info("User retrieval for getAllShifts has started");
            const user = await queryCommands.getUser(new ObjectId(userId.id));
            logger.info(user);
            //Converts each workshop objectId-string to objectId
            if(user.workshopPreferences){
                queryFilters = user.workshopPreferences;
            }
            logger.info("Queryset completed");

            //Database command
            const resultSet = await queryCommands.getAllShifts();
            logger.debug(resultSet)
            const shiftList = [];
            //Filter through preferences
            for (let i = 0; i < resultSet.length; i++) {
                //Puts workshop
                const code = resultSet[i].workshopId.toString();
                //Checks if workshop is included in the queryFilters
                if(resultSet[i].availableUntil > DateTime.now()){
                    //Checks if workshop
                    if(queryFilters.includes(code) || queryFilters.length == 0){
                        //Puts candidatesprofile in candidate of the corresponding shift
                        const userList = resultSet[i].candidateUsers;
                        for (let j = 0; j < userList.length; j++) {
                            resultSet[i].candidates[j].profile = userList[j];
                        }
                        //Format results
                        resultSet[i].client = resultSet[i].client[0];
                        resultSet[i].workshop = resultSet[i].workshop[0];
                        delete resultSet[i].clientId;
                        delete resultSet[i].workshopId;
                        shiftList.push(resultSet[i]);
                    }
                }
            }
            logger.info("Send result to set");
            res.status(200).json({result: shiftList});
        }catch (e) {
            logger.error("resultSet is not well retrieved");
            logger.error(e);
            res.status(400).json({message: "Error"});
        };
    }
    ,
    async getOneShift(req:any, res:any){
        const shiftId = req.params.shiftId;
        const shift = await queryCommands.getOneShift(shiftId);
        if(shift){
            res.status(200).json({result:shift});
        } else {
            res.status(404).json({error: "retrieval_failure" , message: "shift does not exist."})
        }
    }
    ,
    //This is meant to be for the admin or owner, to manage all shifts.
    async getAllShiftsForAdmin(req:any, res:any){
      try {
          const resultset = await queryCommands.getAllShifts();
          res.status(200).json({result: resultset})
      }  catch (e) {
          return res.status(400).json({message: "retrieval_failure"});
      }
    },
    async updateShift(req:any, res: any){
        //Initialise variables
        const shiftId = req.params.shiftId;
        const shift = req.body;
        const workShift = shiftFormat(shift);
        //Database commands
        const update = await queryCommands.updateShift(shiftId, workShift);
        if(update){
            res.status(200).json({message: "Update successfull"});
        }else{
            res.status(400).json({error: "update_failure" ,message: "Update failed"});
        }

    }
    ,
    async deleteShift(req:any, res:any){
        const shiftId = req.params.shiftId;
        await queryCommands.deleteShift(shiftId);
        res.status(200).json({message: "Successful deletion"});
    }
}
function shiftFormat(shift:any){
    let totalTariff;
    let formOfTime;
    let rate;
    let duration = getHoursFromTimeStampList(shift.timestamps);
    //Database command
    // @ts-ignore
    const isHourRate = decideFormOfRate(shift.hourRate);
    if(isHourRate){
        totalTariff = calculateFullRate(duration, shift.hourRate).toFixed(2);
        formOfTime = "per uur";
        rate = shift.hourRate.toFixed(2);
        delete shift.dayRate;
    } else{
        totalTariff = shift.dayRate.toFixed(2);
        formOfTime = "per dag";
        rate = shift.dayRate.toFixed(2);
        delete shift.hourRate;
    }
    shift.workshopId = new ObjectId(shift.workshopId);
    shift.clientId = new ObjectId(shift.clientId);
    shift.date = DateTime.fromISO(shift.date);
    shift.availableUntil = DateTime.fromISO(shift.availableUntil);
    const shiftObject: WorkshopShiftBody ={
        workshopId: shift.workshopId,
        clientId:shift.clientId,
        location: {
            address: shift.location.address,
            city: shift.location.city,
            postalCode: shift.location.postalCode,
            country: shift.location.country
        },
        date: shift.date,
        availableUntil: shift.availableUntil,
        maximumParticipants: shift.maximumParticipants,
        extraInfo: shift.extraInfo,
        level: shift.level,
        targetAudience: shift.targetAudience,
        timestamps: shift.timestamps,
        tariff: rate,
        total_Amount: totalTariff,
        formOfTime: formOfTime,
        participants: shift.participants || [],
        candidates: shift.candidates || []
    };
    return shiftObject;
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