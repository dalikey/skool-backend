import express from 'express';
import loginRouter from './src/routes/login.routes';
import bodyParser from 'body-parser';
import con from 'dotenv';
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
    console.log("Hello worlds");
    next();
})

app.listen(port, ()=>{
    console.log(`Example appS listening on port Typescript tested ${port}`);
})