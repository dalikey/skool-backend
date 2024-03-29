import express, {Request} from 'express';
import loginRouter from './routes/login.routes';
import bodyParser from 'body-parser';
import con from 'dotenv';
import Logger from 'js-logger';
import cors from 'cors';
import registrationRouter from './routes/registration.routes';
import userRouter from "./routes/user.routes";
import workshopRouter from "./routes/workshop.routes";
import customerRoutes from "./routes/customer.routes";
import workshopShiftRoutes from "./routes/workshopShift.routes";
// @ts-ignore
import fileHandler from 'express-fileupload';
import enrollRoutes from "./routes/enroll.routes";
import messageRouter from "./routes/templateMessage.routes";
import templateMessageRoutes from "./routes/templateMessage.routes";

Logger.useDefaults();
con.config();
const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded())
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
app.use(enrollRoutes);
app.use(workshopRouter);
app.use(messageRouter);
app.use(templateMessageRoutes);

export default app;
