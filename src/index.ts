import express, {Request} from 'express';
import loginRouter from './routes/login.routes';
import bodyParser from 'body-parser';
import con from 'dotenv';
import Logger from 'js-logger';
import cors from 'cors';
import registrationRouter from './routes/registration.routes';
import userRouter from "./routes/user.routes";
import customerRoutes from "./routes/customer.routes";
import workshopShiftRoutes from "./routes/workshopShift.routes";
// @ts-ignore
import fileHandler from 'express-fileupload';

Logger.useDefaults();
con.config();
const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.use(cors());
app.use(fileHandler());
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



app.use(customerRoutes);
app.use(loginRouter);
app.use(registrationRouter);
app.use(userRouter);
app.use(workshopShiftRoutes);


export default app;
