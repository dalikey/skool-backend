import express from 'express';
import loginRouter from './routes/login.routes';
import bodyParser from 'body-parser';
import con from 'dotenv';
import Logger from 'js-logger';
import registrationRouter from './routes/registration.routes';

Logger.useDefaults();
con.config();
const app = express();
const port = process.env.PORT;


app.use(bodyParser.json());
app.use(loginRouter);
app.use(registrationRouter);


//Catching errors
app.use((err:any, req:any, res:any, next:any)=>{
    res.status(err.status).json({err});
})
app.all("*", (req:any, res:any, next:any)=>{
    Logger.info(`${req.method} ${req.url}`);
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URI || "*");
    next();
})

app.listen(port, ()=>{
    console.log(`Running Skool-API on ${port}`);
})