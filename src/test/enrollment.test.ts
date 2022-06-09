import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import {CustomerBody} from "../models/customerBody";
import {ObjectId} from "mongodb";
import {DateTime} from "luxon";

chai.should();
chai.use(chaiHttp);

describe('Enroll to workshop', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        await collection.insertOne({_id: new ObjectId("62a20e41bce044ece60a1e3f"), participants: [], maximumParticipants: 1, availableUntil: DateTime.now().plus({day: 1})});
        await collection.insertOne({_id: new ObjectId("62a213d47782483d77ab0dc5"), participants: [], maximumParticipants: 1, availableUntil: DateTime.now().minus({day: 1})});
    })

    describe('Failed enrollment', ()=>{
        it('No token', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a20e41bce044ece60a1e3f"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll`)
                .send({motivation: "Ik zit"})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("unauthorized");
                    message.should.be.equal("You need to provide authorization for this endpoint!");
                    done();
                })
        })

        it('Invalid token', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1"});
            const shiftId = "62a20e41bce044ece60a1e3f"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll`)
                .send({motivation: "Ik zit"})
                .set({authorization: authToken})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("unauthorized");
                    message.should.be.equal("You need to provide authorization for this endpoint!");
                    done();
                })
        })

        it('Non existent shift', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a2105fc6dcef9e88b6b8be"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll`)
                .send({motivation: "Ik zit"})
                .set({authorization: authToken})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("non_existent");
                    message.should.be.equal("shift does not exist");
                    done();
                })
        })

        it('Expired enrolldate', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a213d47782483d77ab0dc5"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll`)
                .set({authorization: authToken})
                .send({motivation: "Ik zit"})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("time_issue");
                    message.should.be.equal("shift is not available for enrollment.");
                    done();
                })
        })
    })

    describe('Successfully enrolled to workshop', ()=>{
        it('Enroll the right way', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a20e41bce044ece60a1e3f"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll`)
                .set({authorization: authToken})
                .send({motivation: "Ik zit"})
                .end((err, res)=>{
                    let {message} = res.body;
                    message.should.be.equal("user has send enrollment.");
                    done();
                })
        })
    })

    after(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        const query = { $pull: { candidates: { userId: new ObjectId("6295e96d7f984a246108b36e") } } };
        await collection.updateMany({_id: new ObjectId("62a1cd10eef1665408244fe9")}, query);
        await collection.deleteMany({_id: new ObjectId("62a20e41bce044ece60a1e3f")});
        await collection.deleteMany({_id: new ObjectId("62a213d47782483d77ab0dc5")});
    })
})