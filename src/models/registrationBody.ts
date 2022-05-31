export interface registrationBody{
    emailAddress: string,
    password: string
    passwordConfirm: string
    firstName: string
    lastName: string
}

export interface registrationInsert{
    emailAddress: string,
    password: string,
    firstName: string,
    lastName: string
}
