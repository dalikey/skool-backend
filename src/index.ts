import express from 'express';
import loginRouter from './routes/login.routes';
import bodyParser from 'body-parser';
import con from 'dotenv';
import Logger from 'js-logger';

Logger.useDefaults();
con.config();
const app = express();
const port = process.env.PORT;


app.use(bodyParser.json());
app.use(loginRouter);


//Catching errors
app.use((err:any, req:any, res:any, next:any)=>{
    res.status(err.status).json({err});
})
app.all("*", (req:any, res:any, next:any)=>{
    Logger.info("Hello worlds");
    next();
})

app.listen(port, ()=>{
    console.log(`Example appS listening on port Typescript tested ${port}`);
})