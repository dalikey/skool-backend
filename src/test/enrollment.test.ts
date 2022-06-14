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
const emptyShift = {_id: new ObjectId("62a4607c4540f4612588a42f"), maximumParticipants: 2, participants: [], candidates: [
        {userId: new ObjectId("62a4617f33427f5d3fe48f55"), shiftId: new ObjectId("62a4607c4540f4612588a42f"), status: "Pending"},
        {userId: new ObjectId("62a4607c4540f4612588a42f"), shiftId: new ObjectId("62a4607c4540f4612588a42f"), status: "Pending"}
    ]};
const fullShift = {_id: new ObjectId("62a4626bd8951db31e6ca14d"), maximumParticipants: 1, participants: [new ObjectId("62a4617f33427f5d3fe48f55")],
    candidates: [{userId: new ObjectId("62a4617f33427f5d3fe48f55"), shiftId: new ObjectId("62a4626bd8951db31e6ca14d"), status: "Current"},  {userId: new ObjectId("62a464ceafbae637a6aad1f4"), shiftId: new ObjectId("62a4626bd8951db31e6ca14d"), status: "Pending"}]};
const shiftWithDuplication= {_id: new ObjectId("62a465586e5066876d3155fc"), maximumParticipants: 2, participants: [{userId: new ObjectId("62a4617f33427f5d3fe48f55")}],
    candidates: [
        {userId: new ObjectId("62a4617f33427f5d3fe48f55"), shiftId: new ObjectId("62a465586e5066876d3155fc"), status: "Current"},
        {userId: new ObjectId("62a464ceafbae637a6aad1f4"), shiftId: new ObjectId("62a465586e5066876d3155fc"), status: "Pending"}
    ]};

const shiftWithRightTime = {_id: new ObjectId("62a79511aa3c79aec3e0ac7f"), maximumParticipants: 2,date: DateTime.now().plus({hour:50}), participants: [{userId: new ObjectId("62a4617f33427f5d3fe48f55")}],
    candidates: [
        {userId: new ObjectId("62a4617f33427f5d3fe48f55"), shiftId: new ObjectId("62a465586e5066876d3155fc"), status: "Current"},
        {userId: new ObjectId("62a464ceafbae637a6aad1f4"), shiftId: new ObjectId("62a465586e5066876d3155fc"), status: "Pending"}
    ]};
const shiftExpireTime= {_id: new ObjectId("62a795186fc817c048e11d4d"), maximumParticipants: 2,date: DateTime.now().plus({hour:47}), participants: [{userId: new ObjectId("62a4617f33427f5d3fe48f55")}],
    candidates: [
        {userId: new ObjectId("62a4617f33427f5d3fe48f55"), shiftId: new ObjectId("62a465586e5066876d3155fc"), status: "Current"},
        {userId: new ObjectId("62a464ceafbae637a6aad1f4"), shiftId: new ObjectId("62a465586e5066876d3155fc"), status: "Pending"}
    ]};
const user11 = {_id: new ObjectId("62a4607c4540f4612588a42f"), firstName: "Eline", lastName: "Sebastiaan", emailAddress: "email@example.com"};
const user12 = {_id: new ObjectId("62a464ceafbae637a6aad1f4"), firstName: "Eline", lastName: "Sebastiaan", emailAddress: "email@example.com"};
const user13 = {_id: new ObjectId("62a4617f33427f5d3fe48f55"), firstName: "Eline", lastName: "Sebastiaan", emailAddress: "email@example.com"};
const user14 = {_id: new ObjectId("62a2270f89fbb3801d3c1e95"), firstName: "Eline", lastName: "Sebastiaan", emailAddress: "email@example.com"};
const unknownUser = {Extern_Status: "62a785fdb79ef526486a055f", firstName: "Thomas", lastName: "de Onbekende", emailAddress: "onbekend@unknownExample.who", phoneNumber: "06 45500123", tariff: 175.50, formOfHour: "Per dag"};

describe('Enroll to workshop', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        const user =await  queryCommands.getUserCollection();
        const pushQuery = {$push: {candidates: {userId: new ObjectId("6299f064aa4cd598e78e59bb"), shiftId: new ObjectId("62a20e41bce044ece60a1e3f")}}};
        await collection.insertOne({_id: new ObjectId("62a20e41bce044ece60a1e3f"), participants: [], maximumParticipants: 1, availableUntil: DateTime.now().plus({day: 1})});
        await collection.insertOne({_id: new ObjectId("62a213d47782483d77ab0dc5"), participants: [], maximumParticipants: 1, availableUntil: DateTime.now().minus({day: 1})});
        await user.insertOne(user14);
        await collection.updateOne({_id: new ObjectId("62a20e41bce044ece60a1e3f")}, pushQuery);
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
        it('Already enrolled', (done)=>{
            const authToken = jwt.sign({id: "6299f064aa4cd598e78e59bb", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a20e41bce044ece60a1e3f"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll`)
                .send({motivation: "Ik zit"})
                .set({authorization: authToken})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("already_enrolled");
                    message.should.be.equal("user has already been enrolled");
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
            const authToken = jwt.sign({id: "62a2270f89fbb3801d3c1e95", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
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
        const user = await  queryCommands.getUserCollection();
        const query = { $pull: { candidates: { userId: new ObjectId("6295e96d7f984a246108b36e") } } };
        await collection.updateMany({_id: new ObjectId("62a1cd10eef1665408244fe9")}, query);
        await collection.deleteMany({_id: new ObjectId("62a20e41bce044ece60a1e3f")});
        await collection.deleteMany({_id: new ObjectId("62a213d47782483d77ab0dc5")});
        await user.deleteOne({_id: new ObjectId("62a2270f89fbb3801d3c1e95")});
    })
})
describe('Confirmation enrollment', ()=>{

    before(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        const userCollect = await queryCommands.getUserCollection();
        await collection.insertMany([emptyShift, fullShift, shiftWithDuplication])
        await userCollect.insertOne(user11);
    })
    after(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        const userCollect = await queryCommands.getUserCollection();
        await collection.deleteOne({_id: new ObjectId("62a4607c4540f4612588a42f")});
        await collection.deleteOne({_id: new ObjectId("62a4626bd8951db31e6ca14d")});
        await collection.deleteOne({_id: new ObjectId("62a465586e5066876d3155fc")});
        await userCollect.deleteOne(user11);
    })

    it('No token', (done)=>{
        chai.request(server)
            .put("/api/workshop/shift/62a4626bd8951db31e6ca14d/enroll/62a4617f33427f5d3fe48f55/confirm")
            .end((err, res)=>{
                let {error, message}= res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal("You need to provide authorization for this endpoint!");
                done();
        })
    })
    it('Not the authorization', (done)=>{
        const authToken = jwt.sign({role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a4626bd8951db31e6ca14d/enroll/62a4617f33427f5d3fe48f55/confirm")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {error, message}= res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal("You do not have the right authority.");
                done();
            })
    })
    it('Full shift, cannot add one more', (done)=>{
        const authToken = jwt.sign({role: "admin"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a4626bd8951db31e6ca14d/enroll/62a464ceafbae637a6aad1f4/confirm")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {error, message}= res.body;
                error.should.be.equal("limit_reached");
                message.should.be.equal("maximum amount of participants reached.");
                done();
            })
    })
    it('Duplication', (done)=>{
        const authToken = jwt.sign({role: "admin"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a465586e5066876d3155fc/enroll/62a4617f33427f5d3fe48f55/confirm")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {error, message}= res.body;
                error.should.be.equal("already_participated");
                message.should.be.equal("user has already been enrolled to this shift");
                done();
            })
    })
    it('Successfull confirmation', (done)=>{
        const authToken = jwt.sign({role: "admin"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a4607c4540f4612588a42f/enroll/62a4607c4540f4612588a42f/confirm")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {message, result}= res.body;
                message.should.be.equal("User has been confirmed to be part of this shift.");
                assert.deepEqual(result, {_id: "62a4607c4540f4612588a42f", maximumParticipants: 2,
                    participants: [{userId: "62a4607c4540f4612588a42f", shiftId: "62a4607c4540f4612588a42f", status: "Current"}],
                    candidates: [{userId: "62a4617f33427f5d3fe48f55", shiftId: "62a4607c4540f4612588a42f", status: "Pending"},
                    ]});
                done();
            })
    })
})
describe('Cancel user participation to shift', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        const userCollect = await queryCommands.getUserCollection();
        await collection.insertMany([emptyShift, fullShift, shiftWithDuplication, shiftWithRightTime, shiftExpireTime])
        await userCollect.insertOne(user13);
    })
    after(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        const userCollect = await queryCommands.getUserCollection();
        await collection.deleteOne({_id: new ObjectId("62a4607c4540f4612588a42f")});
        await collection.deleteOne({_id: new ObjectId("62a4626bd8951db31e6ca14d")});
        await collection.deleteOne({_id: new ObjectId("62a465586e5066876d3155fc")});
        await collection.deleteOne({_id: new ObjectId("62a79511aa3c79aec3e0ac7f")});
        await collection.deleteOne({_id: new ObjectId("62a795186fc817c048e11d4d")});
        await userCollect.deleteOne(user13);
    })

    it('No token to cancel participation', (done)=>{
        chai.request(server)
            .put("/api/workshop/shift/62a4626bd8951db31e6ca14d/enroll/62a4617f33427f5d3fe48f55/canceled")
            .end((err, res)=>{
                let {error, message}= res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal("You need to provide authorization for this endpoint!");
                done();
            })
    })
    it('Not the authorization to cancel participation', (done)=>{
        const authToken = jwt.sign({role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a4626bd8951db31e6ca14d/enroll/62a4617f33427f5d3fe48f55/canceled")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {error, message}= res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal("You do not have the right authority.");
                done();
            })
    })
    it('Successfully canceled participation', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a465586e5066876d3155fc/enroll/62a4617f33427f5d3fe48f55/canceled")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {message, result}= res.body;
                message.should.be.equal("Participation has been canceled.");
                done();
            })
    })

    it('Successfully canceled own participation', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a79511aa3c79aec3e0ac7f/resign/62a4617f33427f5d3fe48f55/cancelled")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {message, result}= res.body;
                message.should.be.equal("Participation has been canceled.");
                done();
            })
    })

    it('unSuccessfully canceled own participation', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a795186fc817c048e11d4d/resign/62a4617f33427f5d3fe48f55/cancelled")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {message, result}= res.body;
                message.should.be.equal("Cannot remove shift, if the difference in time is less then 48 hours");
                done();
            })
    })
})
describe('Reject user enrollment to shift', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        const userCollect = await queryCommands.getUserCollection();
        await collection.insertMany([emptyShift, fullShift, shiftWithDuplication])
        await userCollect.insertOne(user12);
    })
    after(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        const userCollect = await queryCommands.getUserCollection();
        await collection.deleteOne({_id: new ObjectId("62a4607c4540f4612588a42f")});
        await collection.deleteOne({_id: new ObjectId("62a4626bd8951db31e6ca14d")});
        await collection.deleteOne({_id: new ObjectId("62a465586e5066876d3155fc")});
        await userCollect.deleteOne(user12);
    })

    it('No token to reject enrollment', (done)=>{
        chai.request(server)
            .put("/api/workshop/shift/62a4626bd8951db31e6ca14d/enroll/62a4617f33427f5d3fe48f55/rejected")
            .end((err, res)=>{
                let {error, message}= res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal("You need to provide authorization for this endpoint!");
                done();
            })
    })
    it('Not the authorization to reject enrollment', (done)=>{
        const authToken = jwt.sign({role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a4626bd8951db31e6ca14d/enroll/62a4617f33427f5d3fe48f55/rejected")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {error, message}= res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal("You do not have the right authority.");
                done();
            })
    })

    it('Successfully rejected enrollment', (done)=>{
        const authToken = jwt.sign({role: "admin"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server)
            .put("/api/workshop/shift/62a465586e5066876d3155fc/enroll/62a464ceafbae637a6aad1f4/rejected")
            .set({authorization:authToken})
            .end((err, res)=>{
                let {message, result}= res.body;
                message.should.be.equal("User has been rejected from the workshop");
                assert.deepEqual(result, [
                    {userId: "62a4617f33427f5d3fe48f55", shiftId: "62a465586e5066876d3155fc", status: "Current"},
                    {userId: "62a464ceafbae637a6aad1f4", shiftId: "62a465586e5066876d3155fc", status: "Rejected"}
                ])
                done();
            })
    })
})
describe('Enroll unknown user to shift.', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        await collection.insertOne({_id: new ObjectId("62a213d47782483d77ab0dc5"), participants: [unknownUser], maximumParticipants: 2, availableUntil: DateTime.now().minus({day: 1})});
    })
    after(async ()=>{
        const collection = await queryCommands.getShiftCollection();
        await collection.deleteOne({_id: new ObjectId("62a213d47782483d77ab0dc5")});
    })
    describe('Enrollment of unknown user', ()=>{
        it('No token', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a20e41bce044ece60a1e3f"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll/unknownUser`)
                .send({motivation: "Ik zit"})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("unauthorized");
                    message.should.be.equal("You need to provide authorization for this endpoint!");
                    done();
                })
        })

        it('No authority', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a20e41bce044ece60a1e3f"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll/unknownUser`)
                .send({motivation: "Ik zit"})
                .set({authorization: authToken})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("unauthorized");
                    message.should.be.equal("You do not have the right authority.");
                    done();
                })
        })

        it('Wrong inputvalidation', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a213d47782483d77ab0dc5"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll/unknownUser`)
                .send({
                    firstName: "Thibaut",
                    lastName: "Courtois",
                    emailAddress: "Thibaut@example.esp",
                })
                .set({authorization: authToken})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    error.should.be.equal("input_error");
                    message.should.be.equal("Missing inputfields");
                    done();
                })
        })
        it('Insertion of unknown user', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36e", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a213d47782483d77ab0dc5"
            chai.request(server).post(`/api/workshop/shift/${shiftId}/enroll/unknownUser`)
                .send({
                    firstName: "Thibaut",
                    lastName: "Courtois",
                    emailAddress: "Thibaut@example.esp",
                    phoneNumber: "0645502011",
                    hourRate: 99.89
                })
                .set({authorization: authToken})
                .end((err, res)=>{
                    let {message} = res.body;
                    message.should.be.equal("Unknown user successfully registered in shift.");
                    done();
                })
        })
    })
    describe('Deletion of unknown user, the regular api call for participants. /api/workshop/shift/:shiftId/enroll/:userId/canceled', ()=>{
        it('Deletion of unknown user', (done)=>{
            const authToken = jwt.sign({id: "62a785fdb79ef526486a055f", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            const shiftId = "62a213d47782483d77ab0dc5"
            const userId = "62a785fdb79ef526486a055f";
            chai.request(server).put(`/api/workshop/shift/${shiftId}/enroll/${userId}/canceled`)
                .send({emailAddress: "onbekend@unknownExample.who"})
                .set({authorization: authToken})
                .end((err, res)=>{
                    let {error, message} = res.body;
                    message.should.be.equal("Participation has been canceled.");
                    done();
                })
        })
    })
})