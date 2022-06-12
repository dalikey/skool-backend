import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import {ObjectId} from "mongodb";
import {DateTime} from "luxon";

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
                    hourRate: 45.0123143,
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
                    extraInfo: "Nothing@@@",
                    timestamps: [{startTime: "11:00", endTime: "13:00"}, {startTime: "14:00", endTime: "16:00"}],
                    hourRate: 45.00,
                    dayRate: undefined,
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
        queryCommands.getShiftCollection().then(async collection => {
            await collection.deleteMany({extraInfo: {$in: ["Nothing@@@"]}});
            done();
        })
    })
})


const dateDummy = DateTime.now().minus({day:3}).toISODate();
const availableD = DateTime.now().minus({day:1}).toISODate();
const workshopsShift = {
    _id: new ObjectId("62a242ff67ffdef340ff0c95"),
    workshopId: new ObjectId("62a242e04cf01cbac99d7d0f"),
    clientId: new ObjectId("62a242f5fa1b3d40ef808468"),
    maximumParticipants: 6,
    targetAudience: "WO",
    level: "WO",
    location:{
        address: "teststraat 1",
        postalCode: "3000VN",
        city: "Haarlem",
        country: "Nederland"
    },
    date: dateDummy,
    availableUntil: availableD,
    startTime: "18:00",
    endTime: "22:00",
    hourRate: 35.50,
    dayRate: undefined,
    breakTime: 0
}

const workshopsShift2 = {
    _id: new ObjectId("62a24334ede1fac86edd1701"),
    workshopId: new ObjectId("62a2434060f613b82112c12d"),
    clientId: new ObjectId("62a24347ec4ee19b0cb1d73b"),
    maximumParticipants: 6,
    targetAudience: "WO",
    level: "WO",
    location:{
        address: "teststraat 1",
        postalCode: "3000VN",
        city: "Haarlem",
        country: "Nederland"
    },
    date: DateTime.now().plus({day:2}),
    availableUntil: DateTime.now().plus({day:5}),
    startTime: "18:00",
    endTime: "22:00",
    hourRate: 35.50,
    dayRate: undefined,
    breakTime: 0
}

const user = {_id: new ObjectId("62a39fa5dfb7a383d6edce09"), name: "TestBob", availableUntil: DateTime.now(), workshopPreferences: []};
describe('Retrieve workshops', ()=>{
    before(async ()=>{
        const col = await queryCommands.getShiftCollection();
        const col2 = await queryCommands.getUserCollection();
        await col.insertMany([workshopsShift2, workshopsShift]);
        await col2.insertOne(user);
    })
    after(async ()=>{
        const col = await queryCommands.getShiftCollection();
        const col2 = await queryCommands.getUserCollection();
        await col.deleteMany({_id: {$in: [new ObjectId("62a24334ede1fac86edd1701"), new ObjectId("62a242ff67ffdef340ff0c95")]}});
        await col2.deleteOne(user);
    })
    it('No token', (done)=>{
        chai.request(server).get('/api/workshop/shift').end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You need to provide authorization for this endpoint!');
            done();
        })
    })

    it('Invalid token', (done)=>{
        const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1"});
        chai.request(server).get('/api/workshop/shift').set({authorization: authToken}).end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You need to provide authorization for this endpoint!');
            done();
        })
    })

    it('Gets workshopshifts', (done)=>{
        const authToken = jwt.sign({id: "62a39fa5dfb7a383d6edce09", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).get('/api/workshop/shift').set({authorization: authToken}).end((err, res)=>{
            let { result } = res.body;
            assert(result.length >= 1);
            done();
        })
    })

    it('Gets one workshop', (done)=>{
        const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        const shiftId = "62a242ff67ffdef340ff0c95";
        chai.request(server).get(`/api/workshop/shift/${shiftId}/single`)
            .set({authorization: authToken})
            .end((err, res)=>{
            let {result} = res.body;
            assert.deepEqual(result, {_id: "62a242ff67ffdef340ff0c95",
                workshopId: "62a242e04cf01cbac99d7d0f",
                clientId: "62a242f5fa1b3d40ef808468",
                maximumParticipants: 6,
                targetAudience: "WO",
                level: "WO",
                location:{
                    address: "teststraat 1",
                    postalCode: "3000VN",
                    city: "Haarlem",
                    country: "Nederland"
                },
                date: dateDummy,
                availableUntil: availableD,
                startTime: "18:00",
                endTime: "22:00",
                hourRate: 35.50,
                dayRate: null,
                breakTime: 0
            })
            done();
        })
    })
})

describe('Delete workshopshifts', ()=>{
    // before(async ()=>{
    //     // const collection = await queryCommands.getShiftCollection();
    //     // await collection.insertMany([workshopsShift, workshopsShift2]);
    // })

    it('No token', (done)=>{
        chai.request(server).delete('/api/workshop/shift/nr4/delete').end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You need to provide authorization for this endpoint!');
            done();
        })
    })
})