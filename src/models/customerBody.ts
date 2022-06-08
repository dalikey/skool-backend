export interface CustomerBody {
    name:string,
    contact: {
        phoneNumber:string,
        emailAddress:string,
    },
    location:{
        address: string,
        city:string,
        postalCode: string,
        country: string
    },
    logo:string,
}