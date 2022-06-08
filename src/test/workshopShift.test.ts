import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import {ObjectId} from "mongodb";

chai.should();
chai.use(chaiHttp);

describe('Failed workshopShift insert', ()=>{
    describe('Authorithy issues', ()=> {
        it('No token', (done)=>{
            chai.request(server)
                .post('/api/workshop/shift')
                .end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal('You need to provide authorization for this endpoint!');
                done();
            })
        })
        it('Invalid token: not the right role', (done)=>{
            const authToken = jwt.sign({role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/shift')
                .set({authorization: authToken})
                .end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal('You do not have the right authority.');
                done();
            })
        })
    })

    describe('Wrong inputfields shift', ()=>{
        it('No ClientId', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/shift')
                .set({authorization: authToken})
                .send({
                    workshopId: "6290c81e409379906a5dba4a",

                    function: "Docent Vloggen",
                    maximumParticipants: 3,
                    targetAudience: "VO",
                    level: "MBO",
                    location:{
                        address: "teststraat 1",
                        postalCode: "3000VN",
                        city: "Haarlem",
                        country: "Nederland"
                    },
                    date: "2022-09-21",
                    availableUntil: "2022-09-01",
                    startTime: "18:00",
                    endTime: "21:00",
                    hourRate: 45.00,
                    dayRate: undefined,
                    breakTime: 30
                })
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("input_error");
                    message.should.be.equal('Input is wrong');
                    done();
                })
        })
        it('No hourRate and dayrate', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/shift')
                .set({authorization: authToken})
                .send({
                    workshopId: "6290c81e409379906a5dba4a",
                    clientId: "6290c737409379906a5dba47",
                    function: "VoorbeeldFunctie@Uniek",
                    maximumParticipants: 3,
                    targetAudience: "VO",
                    level: "MBO",
                    location:{
                        address: "teststraat 1",
                        postalCode: "3000VN",
                        city: "Haarlem",
                        country: "Nederland"
                    },
                    date: "2022-09-21",
                    availableUntil: "2022-09-01",
                    startTime: "18:00",
                    endTime: "21:00",

                    breakTime: 30
                })
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("input_error");
                    message.should.be.equal('Input is wrong');
                    done();
                })
        })

        it('No hourRate and dayrate', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/shift')
                .set({authorization: authToken})
                .send({
                    workshopId: "6290c81e409379906a5dba4a",
                    clientId: "6290c737409379906a5dba47",
                    function: "Docent Vloggen",

                    targetAudience: "VO",
                    level: "MBO",
                    location:{
                        address: "teststraat 1",
                        postalCode: "3000VN",
                        city: "Haarlem",
                        country: "Nederland"
                    },
                    date: "2022-09-21",
                    availableUntil: "2022-09-01",
                    startTime: "18:00",
                    endTime: "21:00",
                    hourRate: 45.00,
                    dayRate: undefined,
                    breakTime: 30
                })
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("input_error");
                    message.should.be.equal('Input is wrong');
                    done();
                })
        })
    })

    describe('Successful tests', ()=>{
        it('Correct input', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/workshop/shift')
                .set({authorization: authToken})
                .send({
                    workshopId: "6290c81e409379906a5dba4a",
                    clientId: "6290c737409379906a5dba47",
                    function: "VoorbeeldFunctie@Uniek",
                    maximumParticipants: 3,
                    targetAudience: "VO",
                    level: "MBO",
                    location:{
                        address: "teststraat 1",
                        postalCode: "3000VN",
                        city: "Haarlem",
                        country: "Nederland"
                    },
                    date: "2022-09-21",
                    availableUntil: "2022-09-01",
                    startTime: "18:00",
                    endTime: "21:00",
                    hourRate: undefined,
                    dayRate: 220,
                    breakTime: 30
                })
                .end((err, res)=>{
                    let {message} = res.body;
                    message.should.be.equal('shift added');
                    done();
                })
        })
    })

    after((done)=>{
        queryCommands.getShiftCollection().then(collection =>{
            collection.deleteMany({function: {$in: ["VoorbeeldFunctie@Uniek"]}});
            done();
        })
    })
})

const workshopsShift = {
    _id: new ObjectId(100),
    workshopId: new ObjectId(200),
    clientId: new ObjectId(300),
    function: "Dummy@#DataWorkshopShift",
    maximumParticipants: 6,
    targetAudience: "WO",
    level: "WO",
    location:{
        address: "teststraat 1",
        postalCode: "3000VN",
        city: "Haarlem",
        country: "Nederland"
    },
    date: "2022-09-21",
    availableUntil: "2022-09-01",
    startTime: "18:00",
    endTime: "22:00",
    hourRate: 35.50,
    dayRate: undefined,
    breakTime: 0
}
const workshopsShift2 = {
    workshopId: "6290c81e409379906a5dba4a",
    clientId: "6290c737409379906a5dba47",
    function: "Dummy@#DataWorkshopShiftNummer2",
    maximumParticipants: 6,
    targetAudience: "WO",
    level: "WO",
    location:{
        address: "teststraat 1",
        postalCode: "3000VN",
        city: "Haarlem",
        country: "Nederland"
    },
    date: "2022-09-21",
    availableUntil: "2022-09-01",
    startTime: "18:00",
    endTime: "20:00",
    hourRate: 35.50,
    dayRate: undefined,
    breakTime: 0
}

describe('Delete workshopshifts', ()=>{
    before((done)=>{
        queryCommands.getShiftCollection().then(collection => {
            collection.insertOne(workshopsShift);
            done();
        })
    })

    it('No token', (done)=>{
        chai.request(server).delete('/api/workshop/shift/nr4').end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You need to provide authorization for this endpoint!');
            done();
        })
    })
})