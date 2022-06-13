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
// REGISTRATION_ACCEPT
// REGISTRATION_REJECT
// PASSWORD_FORGOT
// SHIFT_ENROLL_REQUEST
// SHIFT_ENROLL_CONFIRMATION
// SHIFT_ENROLL_REJECT
// SHIFT_ENROLL_INVITATION

export const triggers = ["REGISTRATION_ACCEPT", "ENROLLMENT_ACCEPT", "REGISTRATION_REJECT", "PASSWORD_FORGOT", "SHIFT_ENROLL_REQUEST","SHIFT_ENROLL_CONFIRMATION" ,"SHIFT_ENROLL_REJECT", "SHIFT_ENROLL_INVITATION"];
export const triggerValues = {
    enrollAccept:()=>{
        return "REGISTRATION_ACCEPT"
    },
    enrollReject:()=>{
        return "REGISTRATION_REJECT"
    },passwordForgot:()=>{
        return "PASSWORD_FORGOT"
    },shiftEnrollRequest:()=>{
        return "SHIFT_ENROLL_REQUEST"
    },
    shiftConfirmation:()=>{
      return "SHIFT_ENROLL_CONFIRMATION"
    },
    shiftRejection:()=>{
        return "SHIFT_ENROLL_REJECT"
    },shiftInvitation:()=>{
        return "SHIFT_ENROLL_INVITATION"
    }
}