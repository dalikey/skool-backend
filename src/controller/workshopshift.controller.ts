import {queryCommands} from "../db/databaseCommands";
import assert from "assert";
import {WorkshopShiftBody} from "../models/workshopShiftBody";
import {ObjectId} from "mongodb";
import {DateTime} from 'luxon';
import logger from 'js-logger'
import Logger from 'js-logger'
import {Request, Response} from "express";

let controller = {
    validateWorkshopShiftInput:(req:any, res:any, next:any)=>{
        const workshopShift = req.body;
        //Set up dates.
        let shiftDate = DateTime.fromISO(workshopShift.date);
        let availableDate = DateTime.fromISO(workshopShift.availableUntil);
        let difference = differenceDateInDays(shiftDate, availableDate);
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
            assert(shiftDate > availableDate);
            // @ts-ignore
            assert(difference.days >= 2);
            //Shift time and breaks
            assert(workshopShift.timestamps.length > 0);
            next();
        }catch (e:any){
            return res.status(400).json({error: "input_error", message: "Input is wrong", err: e});
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
            let levelFilter = [];
            logger.info("User retrieval for getAllShifts has started");
            //Gets user
            const user = await queryCommands.getUser(new ObjectId(userId.id));
            logger.info(user);
            //Converts each workshop objectId-string to objectId
            if(user.workshopPreferences){
                queryFilters = user.workshopPreferences;
            }

            if(user.levelPreferences){
                levelFilter = user.levelPreferences;
            }

            //Database command
            let shifts = await queryCommands.getAllShifts();

            //Shift2 filter through time
            // @ts-ignore
            shifts = shifts.filter( v => v.availableUntil > DateTime.now());

            //Filter through full candidates
            // @ts-ignore
            shifts = shifts.filter(shift => shift.maximumParticipants > shift.participants.length);

            //Map queryPreferences
            // @ts-ignore
            const reformedArray = queryFilters.map(({_id})=>(_id.toString()));
            const shiftList = [];
            //Filter through preferences
            for (let i = 0; i < shifts.length; i++) {
                //Puts workshop
                const currentShift = shifts[i];
                const workshop = currentShift.workshop[0];
                //Checks if workshop is included in the queryFilters
                if((reformedArray.includes(workshop._id.toString()) || queryFilters.length == 0) && (levelFilter.includes(currentShift.level) || levelFilter.length == 0)){
                    //Puts candidatesprofile in candidate of the corresponding shift
                    const userList = shifts[i].candidateUsers;
                    for (let j = 0; j < userList.length; j++) {
                        shifts[i].candidates[j].profile = userList[j];
                    }
                    //Format results
                    if(!shifts[i].dayRate || shifts[i].dayRate === 0){
                        Logger.info(user.hourRate);
                        shifts[i].hourRate = user.hourRate;
                        shifts[i].total_Amount = calculateFullRate(getHoursFromTimeStampList(shifts[i].timestamps), user.hourRate);
                    } else {
                        shifts[i].total_Amount = shifts[i].dayRate
                    }
                    logger.info(shifts[i].total_Amount)
                    shifts[i].client = shifts[i].client[0];
                    shifts[i].workshop = shifts[i].workshop[0];
                    delete shifts[i].clientId;
                    delete shifts[i].workshopId;
                    shiftList.push(shifts[i]);
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
          let resultSet = await queryCommands.getAllShifts();
          for (let i = 0; i < resultSet.length; i++) {
              let userList = resultSet[i].candidateUsers;
              for (let j = 0; j < userList.length; j++) {
                  resultSet[i].candidates[j].profile = userList[j];
              }
              resultSet[i].client = resultSet[i].client[0];
              resultSet[i].workshop = resultSet[i].workshop[0];
          }
          res.status(200).json({result: resultSet})
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
        try {
            const update = await queryCommands.updateShift(shiftId, workShift);
            if(update){
                res.status(200).json({message: "Update successfull"});
            }else{
                res.status(400).json({error: "update_failure" ,message: "Update failed"});
            }
        }catch (e) {
            res.status(400).json({error: "database_update_failure" ,message: "Update failed"});
        }


    }
    ,
    async deleteShift(req:any, res:any){
        const shiftId = req.params.shiftId;
        try {
            await queryCommands.deleteShift(shiftId);
            res.status(200).json({message: "Successful deletion"});
        }catch (e:any) {
            res.status(400).json({error: "deletion_failed", message: e})
        }

    }
}
function shiftFormat(shift:any){
    let totalTariff;
    let formOfTime;
    let rate;
    let duration = getHoursFromTimeStampList(shift.timestamps);
    //Database command

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
        dayRate: shift.dayRate,
        date: shift.date,
        availableUntil: shift.availableUntil,
        maximumParticipants: shift.maximumParticipants,
        extraInfo: shift.extraInfo,
        level: shift.level,
        targetAudience: shift.targetAudience,
        timestamps: shift.timestamps,
        participants: shift.participants || [],
        candidates: shift.candidates || []
    };
    return shiftObject;
}
function calculateFullRate(hoursWork: number, hourRate: number) {
    return Number(hoursWork * hourRate).toFixed(2);
}

function decideFormOfRate(hourRate: number) {
    return !!hourRate;

}

function differenceDateInDays(shiftDate: any, availableEnrollDate:any){
    return shiftDate.diff(availableEnrollDate, "day").toObject();
}
export function getHoursFromTimeStampList(timeStampsList: any){
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