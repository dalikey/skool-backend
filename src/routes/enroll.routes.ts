import {authorizationMethods, controller} from "../controller/authorization.controller";
import express from "express";
const enrollRoutes = express();
import enrollController from '../controller/enrollment.controller';

//Sends enrollment of his own to the shift.
enrollRoutes.post('/api/workshop/shift/:shiftId/enroll' ,
    controller.validateToken,
    enrollController.checkExistenceShift,
    enrollController.checkEnrollDate,
    enrollController.checkEnrollmentExistence,
    enrollController.enrollToShift)

//Puts the status of the enrollment on current to confirm and put the user in the participantlist.
enrollRoutes.put('/api/workshop/shift/:shiftId/enroll/:userId/confirm',
    controller.validateToken,
    controller.validateAdminRole,
    enrollController.checkAmountOfParticipants,
    //Check duplication within participationlist
    enrollController.checkParticipationDuplication,
    //Puts user in participant list and removes it from candidate-list
    enrollController.confirmEnrollmentToShift
    )

//Puts status on rejected and removes user from participationlist.
enrollRoutes.put('/api/workshop/shift/:shiftId/enroll/:userId/canceled',
    controller.validateToken,
    controller.validateAdminRole,
    //Removes user from participationlist and puts status to rejected.
    enrollController.cancelParticipation
    )
//Puts status on rejected if enrollments is rejected, changes user in candidateslist.
enrollRoutes.put('/api/workshop/shift/:shiftId/enroll/:userId/rejected',
    controller.validateToken,
    controller.validateAdminRole,
    //Reject method
    enrollController.rejectEnrollment
    )
//Puts status on done.
enrollRoutes.put('/api/workshop/shift/:shiftId/enroll/:userId/onDone',
    controller.validateToken,
    controller.validateAdminRole,
    enrollController.putStatusOnDone);
//Removes enrollment
enrollRoutes.put('/api/workshop/shift/:shiftId/enroll/:userId/enroll/delete',
    controller.validateToken,
    controller.validateAdminRole,
    //Removes enrollments and its participation
    //TODO in development
    enrollController.removeEnrollment
)

enrollRoutes.post('/api/workshop/shift/:shiftId/enroll/unknownUser',
    controller.validateToken,
    controller.validateAdminRole,
    enrollController.addUnknownUserToParticipantList
)
export default enrollRoutes;