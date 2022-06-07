export interface CustomerBody {
    name:string,
    emailAddress:string,
    phoneNumber:string,
    logoUrl:string,
    location:{
        street_nr: string,
        city:string,
        postalCode: string,
        country: string
    }
}