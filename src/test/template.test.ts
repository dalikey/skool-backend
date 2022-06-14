import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import dot from 'dotenv';
import {ObjectId} from "mongodb";
dot.config();
chai.use(chaiHttp);

describe('Template creation', ()=>{


    it('Successful insert', (done)=>{
        const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).post('/api/templateMessage')
            .set({authorization: authToken})
            .send({title: "Jacob", content: "Hello feyenoord", trigger: "REGISTRATION_ACCEPT"})
            .end((err, res)=>{
                let {message} = res.body;
                assert(message == "Insert template succeeded");
                done();
            })
    })
    after(async ()=>{
        const col = await queryCommands.getTempMessageCollecton();
        await col.deleteOne({_id: new ObjectId("6295e96d7f984a246108b36e")});
    })
})
//
describe('Template update', ()=>{
    before(async ()=>{
        const col = await queryCommands.getTempMessageCollecton();
        await col.insertOne({_id: new ObjectId("62a766b07f0a2e44784310b5"), title: "Jacob", content: "Hello feyenoord", trigger: "ENROLLMENT_ACCEPT"})
    })
    it('Successful update', (done)=>{
        const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).put('/api/templateMessage/62a766b07f0a2e44784310b5/update')
            .set({authorization: authToken})
            .send({title: "Aron", content: "Hello sunshine", trigger: "ENROLLMENT_ACCEPT"})
            .end((err, res)=>{
                let {result, message} = res.body;
                assert(message ,"Insert template succeeded");
                assert.deepEqual(result ,{_id: "62a766b07f0a2e44784310b5",title: "Aron", content: "Hello sunshine", trigger: "ENROLLMENT_ACCEPT"});
                done();
            })
    })
    after(async ()=>{
        const col = await queryCommands.getTempMessageCollecton();
        await col.deleteOne({_id: new ObjectId("62a766b07f0a2e44784310b5")});
    })
})
describe('Template deletion', ()=>{
    before(async ()=>{
        const col = await queryCommands.getTempMessageCollecton();
        await col.insertOne({_id: new ObjectId("62a766b07f0a2e44784310b5"), title: "Jacob", content: "Hello feyenoord", trigger: "ENROLLMENT_ACCEPT"})
    })
    it('Successful update', (done)=>{
        const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).delete('/api/templateMessage/62a766b07f0a2e44784310b5/delete')
            .set({authorization: authToken})
            .end((err, res)=>{
                let {result, message} = res.body;
                assert(result.deletedCount == 1);
                done();
            })
    })
    after(async ()=>{
        const col = await queryCommands.getTempMessageCollecton();
        await col.deleteOne({_id: new ObjectId("62a766b07f0a2e44784310b5")});
    })
})