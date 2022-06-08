export interface CustomerBody {
    name:string,
    emailAddress:string,
    phoneNumber:string,
    logoUrl:string,
    location:{
        address: string,
        city:string,
        postalCode: string,
        country: string
    }
}