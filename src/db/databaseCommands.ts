import mongodb, { MongoClient } from 'mongodb';
import loginBody from '../models/loginBody';
import conf from 'dotenv';
conf.config();

//MongoDb url
const mongoDBUrl = process.env.DB_URL;
if(!mongoDBUrl){
    throw new Error('No url present');
}
//Database
const skoolWorkshop: string = "skooldevelop";
//Collection
const user: string = "user"
//Client
const client = new MongoClient(mongoDBUrl);
//Connection
let connection:any = null;

export const queryCommands = {

    //Closes connection
    closeDB:()=>{
        connection.close();
        console.log('Connection been cut off');
        connection = null;
    }
    ,
    //Retrieve user based on login body
    async loginUser(loginData: loginBody) {
        try {
            let emailAddress = loginData.emailAddress;
            connection = await client.connect();
            const collection = connection.db(skoolWorkshop).collection(user);
            const queryResult = collection.findOne({emailAddress});
            return queryResult;
        } catch (error:any) {
            throw new Error("Database error");
        }
    }
}
