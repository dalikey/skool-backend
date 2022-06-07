export type userBody = {
    emailAddress: string
    nationality: "nl" | "be" | undefined,
    gender: "m" | "f" | "x" | undefined
    dateOfBirth: Date
    placeOfBirth: string
    countryOfOrigin: string
    mobileNumber: string,
    emailCampaigns: boolean
    textCampaigns: boolean

    location: locationBody
    paymentInfo: paymentBody
    passwordInfo: passwordBody | undefined

    kvkNumber: string
    vatID: string

    workshopPreferences: Array<String>
    transport: transportBody

}

export class User implements userBody {
    constructor(body: userBody) {
        this.countryOfOrigin = body.countryOfOrigin;
        this.dateOfBirth = body.dateOfBirth;
        this.emailAddress = body.emailAddress;
        this.emailCampaigns = body.emailCampaigns;
        if (body.gender !== undefined && ['m', 'f', 'x'].includes(body.gender)) {
            this.gender = body.gender;
        }
        this.kvkNumber = body.kvkNumber;
        this.location = body.location;
        this.mobileNumber = body.mobileNumber;
        if (body.nationality !== undefined && ['nl', 'be'].includes(body.nationality)) {
            this.nationality = body.nationality
        }
        this.paymentInfo = body.paymentInfo;
        this.placeOfBirth  =body.placeOfBirth;
        this.textCampaigns = body.textCampaigns;
        this.transport = body.transport;
        this.vatID = body.vatID;
        this.workshopPreferences = body.workshopPreferences
    }
    countryOfOrigin: string;
    dateOfBirth: Date;
    emailAddress: string;
    emailCampaigns: boolean;
    // @ts-ignore
    gender: "m" | "f" | "x" | undefined;
    kvkNumber: string;
    location: locationBody;
    mobileNumber: string;
    nationality: "nl" | "be" | undefined;
    passwordInfo: passwordBody | undefined;
    paymentInfo: paymentBody;
    placeOfBirth: string;
    textCampaigns: boolean;
    transport: transportBody;
    vatID: string;
    workshopPreferences: Array<String>;

}

export interface mongoUserBody extends userBody {
    passwordInfo: undefined
    password: string,
    profilePicture: Buffer,
    identity: Buffer,
    VOGDocument: Buffer
}

interface locationBody {
    address: string
    postalCode: string
    city: string,
    country: "nl" | "be"
}

interface paymentBody {
    bankNumber: string
    bicCode: string
}

interface transportBody {
    hasDriversLicense: boolean
    hasVehice: boolean
}

interface passwordBody {
    password: string,
    passwordConfirm: string,
    currentPassword: string
}
