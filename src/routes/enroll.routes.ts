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

//Removes user from participation. Without restrictions
enrollRoutes.put('/api/workshop/shift/:shiftId/enroll/:userId/canceled',
    controller.validateToken,
    controller.validateOwnerRole,
    enrollController.cancelParticipation
    )
//Remove enrollment, till 48 hours before shiftdate. meant for admin and users.
enrollRoutes.put('/api/workshop/shift/:shiftId/resign/:userId/cancelled',
    controller.validateToken,
    enrollController.checkCancelationTime,
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
    enrollController.removeEnrollment
)
//Input unknown user
enrollRoutes.post('/api/workshop/shift/:shiftId/enroll/unknownUser',
    controller.validateToken,
    controller.validateAdminRole,
    enrollController.addUnknownUserToParticipantList
)

//Sends invitation to user to enroll to the shift
enrollRoutes.put('/api/workshop/shift/:shiftId/enroll/invitation',
    controller.validateToken,
    controller.validateOwnerRole,
    enrollController.inputValidateInviteAction,
    enrollController.sendInvitationToUser);

//Sends rejection from user to the api, it removes the invitation within the invitation array.
enrollRoutes.get('/api/workshop/shift/:shiftId/enroll/:userId/reject/:token/no',
    enrollController.rejectInvitation);

//Sends puts invited to participation list.
enrollRoutes.get('/api/workshop/shift/:shiftId/accepted/:userId/enroll/:token/invitation',
enrollController.acceptInvitation);

export default enrollRoutes;