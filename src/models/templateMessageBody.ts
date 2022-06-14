import {ObjectId} from "mongodb";

export interface insertTemplateMessage {
    title:string,
    content: string,
    trigger: string
}

export interface templateMessage {
    templateId: string,
    title: string,
    content : string,
    trigger: string
}

// TRIGGER VALUES
export const triggers = ["REGISTRATION_ACCEPT", "ENROLLMENT_ACCEPT", "REGISTRATION_REJECT", "PASSWORD_FORGOT", "SHIFT_ENROLL_REQUEST","SHIFT_ENROLL_CONFIRMATION" ,"SHIFT_ENROLL_REJECT", "SHIFT_ENROLL_INVITATION", "SHIFT_ENROLL_CANCELLATION"];
export const triggerValues = {
    registrationAccept:"REGISTRATION_ACCEPT",
    registrationEnrollReject:"REGISTRATION_REJECT",
    passwordForgot:"PASSWORD_FORGOT",
    shiftEnrollRequest: "SHIFT_ENROLL_REQUEST",
    shiftConfirmation: "SHIFT_ENROLL_CONFIRMATION",
    shiftRejection:"SHIFT_ENROLL_REJECT",
    shiftInvitation:"SHIFT_ENROLL_INVITATION",
    shiftCancellation: "SHIFT_ENROLL_CANCELLATION"
}