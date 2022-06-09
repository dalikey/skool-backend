import express, {Request} from 'express';
import loginRouter from './routes/login.routes';
import bodyParser from 'body-parser';
import con from 'dotenv';
import Logger from 'js-logger';
import cors from 'cors';
import registrationRouter from './routes/registration.routes';
import userRouter from "./routes/user.routes";
import workshopRouter from "./routes/workshop.routes";
import fileupload from "express-fileupload";


Logger.useDefaults();
con.config();
const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded())
app.use(fileupload());
app.use(cors());

//Catching errors
app.use((err:any, req:any, res:any, next:any)=>{
    res.status(err.status).json({err});
})

app.use((req:any, res, next) => {
    Logger.info(`${req.method} ${req.url}`);
    next();
})


app.listen(port, ()=>{
    console.log(`Example appS listening on port Typescript tested ${port}`);
})

app.use(loginRouter);
app.use(registrationRouter);
app.use(userRouter);
app.use(workshopRouter);

export default app;
