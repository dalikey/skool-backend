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
    extraInfo: string,
    level: string,
    targetAudience: string,
    timestamps: any,
    //Wordt deels bepaald bepaald in de API
    tariff: string,
    //Wordt berekent in de API
    total_Amount: number,
    //Wordt bepaald in de API
    formOfTime: string,
    //Automatisch aangemaakt. Participantlijst voor toegewezen medewerkers voor de shift
    //Candidatenlijst is een lijst ingeschreven medewerkers, die nog bevestigt of geweigerd kunnen worden.
    participants: any,
    candidates: any
}

export interface confirmBody{
    userId: string,
    shiftId: string,
    status: string,
    enrollDate: any,
    motivation: string,
}