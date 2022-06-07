export interface workshopBody {
    _id: string;
    name: string;
    city: string;
    street: string;
    description: string;
    // date: Date;
    maxParticipants: number;
    imageUrl: string;
    userId: string;
    isActive: boolean | null;
}

export interface workshopInsert {
    _id: string;
    name: string;
    city: string;
    street: string;
    description: string;
    // date: Date;
    maxParticipants: number;
    imageUrl: string;
    userId: string;
    isActive: boolean | null;
}
