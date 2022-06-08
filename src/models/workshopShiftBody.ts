export interface WorkshopShiftBody{
    workshopId:string,
    clientId:string,
    location:{
        address: string,
        city:string,
        postalCode: string,
        country: string
    },
    date: any,
    availableUntil: any,
    maximumParticipants: number,
    picture: string,
    level: string,
    targetAudience: string,
    startTime: any,
    endTime: any,
    //Wordt deels bepaald bepaald in de API
    tariff: string,
    //Wordt berekent in de API
    total_Amount: number,
    //Wordt bepaald in de API
    formOfTime: string,
    //Wordt bepaald in de API
    hasBreaks: boolean
}