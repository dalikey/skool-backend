import mongodb, { MongoClient } from 'mongodb';
import loginBody from '../models/loginBody';
//MongoDb url
const mongoDBUrl:string = `mongodb+srv://skool:wqnPEYTS5Yjqcs2y@skool-workshop.6qrpk.mongodb.net/test` || process.env.MONGOURL;
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
            let login = loginData;
            connection = await client.connect();
            const collection = connection.db(skoolWorkshop).collection(user);
            const queryResult = collection.findOne({login});
            return queryResult;
        } catch (error) {
            return {status: 500, message: error};
        }
    }
}
