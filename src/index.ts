import { Request, Response } from "express";

require('dotenv').config();
const express = require('express');
const Logger = require('js-logger');
import getDatabase from './modules/database';


const app = express();
const port = process.env.PORT || 3000;

Logger.useDefaults();

const db = getDatabase();

app.get('/', async (req: Request, res: Response) => {
    const collection = db.collection('user');
    const user = await collection.findOne({});
    return res.send({"hello": "world"})
})


app.listen(port, () => {
    Logger.info(`Running Skool Backend on port ${port}`)
})
