import  {emailRegex} from "../controller/registration.controller";
import phoneUtil from "google-libphonenumber";
import assert from "assert";

const postalCodeRegex = /[1-9]{4}[A-z]{2}/;

export type userBody = {
    rejected: Array<string>;
    emailAddress: string | undefined
    firstName: string | undefined
    lastName: string | undefined
    nationality: "Nederlands" | "Belgisch" | undefined,
    gender: "m" | "f" | undefined
    dateOfBirth: Date | undefined
    placeOfBirth: string | undefined
    countryOfOrigin: string | undefined
    mobileNumber: string | undefined,
    emailCampaigns: boolean | undefined
    textCampaigns: boolean | undefined
    role: "user" | "admin" | "owner" | undefined
    levelPreferences: string | undefined
    contractType: "freelancer" | "full-time" | undefined

    location: locationBody | undefined
    paymentInfo: paymentBody | undefined
    passwordInfo: passwordBody

    kvkNumber: string | undefined
    vatID: string | undefined

    workshopPreferences: Array<String> | undefined
    transport: transportBody | undefined

}

export class User implements userBody {
    constructor(body: userBody) {
        this.rejected = [];
        try {
            this.countryOfOrigin = body.countryOfOrigin;
        } catch (err) {
            this.rejected.push('countryOfOrigin')
        }
        try {
            // @ts-ignore
            assert(body.dateOfBirth)
            this.dateOfBirth = new Date(body.dateOfBirth);
        } catch (err) {
            this.rejected.push('dateOfBirth')
        }
        try {
            // @ts-ignore
            assert(body.emailAddress.match(emailRegex))
            this.emailAddress = body.emailAddress;
        } catch (err) {
            this.rejected.push("emailAddress")
        }
        try {
            this.emailCampaigns = body.emailCampaigns;
        } catch (err) {
            this.rejected.push('emailCampaigns')
        }

        try {
            // @ts-ignore
            assert(['m', 'f'].includes(body.gender))
            this.gender = body.gender;
        } catch (err) {
            this.rejected.push("gender")
        }
        this.kvkNumber = body.kvkNumber;
        try {
            // @ts-ignore
            assert(body.location.city && body.location.address && body.location.country && body.location.postalCode)
            // @ts-ignore
            assert(['Nederland', 'België'].includes(body.location.country))
            // @ts-ignore
            assert(body.location.postalCode.match(postalCodeRegex))
            this.location = body.location;
        } catch (err) {
            this.rejected.push("location")
        }
        try {
            // @ts-ignore
            if (body.mobileNumber.match(/(06)(\s|\-|)\d{8}|31(\s6|\-6|6)\d{8}/)) {
                this.mobileNumber = body.mobileNumber;
            } else {
                // @ts-ignore
                const number = phoneUtil.PhoneNumberUtil.getInstance().parseAndKeepRawInput(body.mobileNumber);
                if (phoneUtil.PhoneNumberUtil.getInstance().isValidNumber(number)) {
                    this.mobileNumber = body.mobileNumber;
                }
            }
        } catch (err) {
            this.rejected.push("mobileNumber")
        }
        try {
            // @ts-ignore
            assert(['Nederlands', 'Belgisch'].includes(body.nationality))
            this.nationality = body.nationality
        } catch (err) {
            this.rejected.push("nationality");
        }

        this.passwordInfo = body.passwordInfo;

        try {
            // @ts-ignore
            assert(body.paymentInfo.IBAN && body.paymentInfo.BIC)
            this.paymentInfo = body.paymentInfo;
        } catch (err) {
            this.rejected.push("paymentInfo")
        }
        this.placeOfBirth  =body.placeOfBirth;
        this.textCampaigns = body.textCampaigns;
        this.transport = body.transport;
        this.vatID = body.vatID;
        this.workshopPreferences = body.workshopPreferences
        this.lastName = body.lastName
        this.firstName = body.firstName
        this.levelPreferences = body.levelPreferences;
        try {
            // @ts-ignore
            assert(['full-time', 'freelancer'].includes(body.contractType));
            this.contractType = body.contractType;
        } catch (err) {
            this.rejected.push('contractType')
        }
        try {
            assert(body.role);
            assert(['owner', 'admin', 'user'].includes(body.role));
            this.role = body.role
        } catch (err) {}
    }
    countryOfOrigin: string | undefined;
    dateOfBirth: Date | undefined;
    emailAddress: string | undefined;
    emailCampaigns: boolean | undefined;
    // @ts-ignore
    gender: "m" | "f" | undefined;
    kvkNumber: string | undefined;
    location: locationBody | undefined;
    mobileNumber: string | undefined;
    nationality: "Nederlands" | "Belgisch" | undefined;
    passwordInfo: passwordBody;
    paymentInfo: paymentBody | undefined;
    placeOfBirth: string | undefined;
    textCampaigns: undefined | boolean;
    transport: transportBody | undefined;
    vatID: string | undefined;
    workshopPreferences: Array<String> | undefined;
    rejected: Array<string>;
    lastName: string | undefined;
    firstName: string | undefined;
    role: "user" | "owner" | "admin" | undefined
    levelPreferences: string | undefined
    contractType: "freelancer" | "full-time" | undefined

}

interface locationBody {
    address: string
    postalCode: string
    city: string,
    country: "Nederland" | "België"
}

interface paymentBody {
    IBAN: string
    BIC: string
}

interface transportBody {
    hasDriversLicense: boolean
    hasVehicle: boolean
}

interface passwordBody {
    password: string,
    passwordConfirm: string,
    currentPassword: string
}
