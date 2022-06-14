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

chai.should();
chai.use(chaiHttp);
const dummyWorkshop = {
    name: "Programmeren@1@1",
    content: "In deze workshop leren studenten de basis vaardigheden van het programmmeren. Het doel van deze cursus is om een applicatie te bouwen in java.",
    materials: ["Laptop", "Router", "Iphone"]};

const dummyWorkshop2 = {
    _id: new ObjectId("62a719a0d93898eb7ebab646"),
    name: "Aron",
    content: "Wees",
    materials: ["delete", "delete"]};
const updateWorkshop = {
    name: "test",
    content: "test",
    materials: ["delete", "delete"],
    _id: "62a719a0d93898eb7ebab646"};
describe('Workshop creation',()=>{
    describe('Failed insert', ()=>{
        it('No token', (done)=>{
            chai.request(server).post('/api/workshop/add').send({}).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal("You need to provide authorization for this endpoint!");
                done();
            })
        })
        it('Invalid token', (done)=>{
            const authToken = jwt.sign({role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1"});
            chai.request(server).post('/api/workshop/add')
                .set({authorization: authToken})
                .send({})
                .end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal("You need to provide authorization for this endpoint!");
                done();
            })
        })
        it('Invalid authority', (done)=>{
            const authToken = jwt.sign({role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/add')
                .set({authorization: authToken})
                .send({})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("unauthorized");
                    message.should.be.equal("You do not have the right authority.");
                    done();
                })
        })
        it('Lacks input name', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/add')
                .set({authorization: authToken})
                .send({content: "Nothing in the name"})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("input_invalid");
                    message.should.be.equal("Fields are empty");
                    done();
                })
        })
        it('Lacks input description', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/add')
                .set({authorization: authToken})
                .send({name: "Nothing in the content"})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("input_invalid");
                    message.should.be.equal("Fields are empty");
                    done();
                })
        })

    })
    describe('Successfully inserted new workshop', ()=>{
        it('Good insert', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/add')
                .set({authorization: authToken})
                .send(dummyWorkshop)
                .end((err, res)=>{
                    let {message} = res.body;
                    message.should.be.equal("Workshop successfully created.");
                    done();
                })
        })
    })

    after((done)=>{
        queryCommands.getWorkshopCollection().then(collection=>{
             collection.deleteMany({name: {$in:["Programmeren@1@1"]}});
             done();
         })
     })
})

describe('update workshop', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getWorkshopCollection();
        await collection.insertOne(dummyWorkshop2);
    })
    before(async ()=>{
        const collection = await queryCommands.getWorkshopCollection();
        await collection.deleteOne({_id: new ObjectId("62a719a0d93898eb7ebab646")});
    })
    it('Updated workshop', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).put('/api/workshop/62a719a0d93898eb7ebab646/update')
            .send(updateWorkshop)
            .end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("unauthorized")
                message.should.be.equal("You need to provide authorization for this endpoint!");
                done()
            })
    })

    it('Updated workshop', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).put('/api/workshop/62a719a0d93898eb7ebab646/update')
            .set({authorization: authToken})
            .send(updateWorkshop)
            .end((err, res)=>{
            let {message} = res.body;
            message.should.be.equal("Update successfull");
            done()
        })
    })
})