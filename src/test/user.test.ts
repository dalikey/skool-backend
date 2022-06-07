import chaiHttp from "chai-http";
import chai from "chai";
import mochas, { it } from 'mocha';
import server from '../index';
import {MongoClient, ObjectId} from "mongodb";
import jwt from "jsonwebtoken";

chai.should();
chai.use(chaiHttp);

const mongoDBUrl = process.env.DB_URL;
if(!mongoDBUrl){
    throw new Error('No url present');
}
//Database
const skoolWorkshop = process.env.MONGODB;
//Collection
const user: string = "user"
//Client
const client = new MongoClient(mongoDBUrl);
//Connection

const testUser = {_id: new ObjectId("6295e96d7f984a246108b36d") , "emailAddress": "test@example.com", "firstName": "Joe", "lastName": "Mama", role: "user", password: "$2b$06$dG/o1w4WMptTFrWlOpF.8ebOEJzZeonEPDP7g.TEZaUd.7n3ViVcW"}

const adminUser = {_id: new ObjectId("6295e96d7f984a246108b36f"), "emailAddress": "admin@example.com", "firstName": "Admin", "lastName": "Mama", isActive: true, role: "owner", password: "$2b$06$dG/o1w4WMptTFrWlOpF.8ebOEJzZeonEPDP7g.TEZaUd.7n3ViVcW"}


describe('An owner can authorize approve or deny a new user registration.', ()=>{
    before(async () => {
        await client.connect();
        const coll = client.db(skoolWorkshop).collection('user');
        await coll.insertOne(testUser)
        await coll.insertOne(adminUser);
    })

    after(async () => {
        await client.connect();
        const coll = client.db(skoolWorkshop).collection('user');
        await coll.deleteOne({"emailAddress": "test@example.com"})
        await coll.deleteOne({"emailAddress": "admin@example.com"});
    })
    describe('Unauthorized', ()=>{
        it('User is not logged in for /api/user', (done)=>{
            chai.request(server).get('/api/user/').send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(401);
                done();
            })
        })

        it('User is not logged in for /api/user/:userId/activate', (done)=>{
            chai.request(server).post('/api/user/6295e96d7f984a246108b36d/activate').send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(401);
                done();
            })
        })

        it('User is not logged in for POST /api/user/:userId/deactivate', (done)=>{
            chai.request(server).post('/api/user/6295e96d7f984a246108b36d/deactivate').send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(401);
                done();
            })
        })

        it('User is not logged in for GET /api/user/@me', (done)=>{
            chai.request(server).get('/api/user/@me').send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(401);
                done();
            })
        })
        it('User is not logged in for PUT /api/user/:userId', (done)=>{
            chai.request(server).put('/api/user/6295e96d7f984a246108b36d').send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(401);
                done();
            })
        })


    })
    describe('Forbidden', () => {
        it('User does not belong to role owner for GET /api/user', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).get('/api/user').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(403);
                done();
            })
        })
        it('User does not belong to role owner for GET /api/user/:userId/activate', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).post('/api/user/6295e96d7f984a246108b36d/activate').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(403);
                done();
            })
        })
        it('User does not belong to role owner for GET /api/user/:userId/deactivate', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).post('/api/user/6295e96d7f984a246108b36d/deactivate').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(403);
                done();
            })
        })
        it('User does not have permission to edit user', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36f", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).put('/api/user/6295e96d7f984a246108b36d').set({authorization: authToken}).send({nationality: "nl"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(403);
                done();
            })
        })
        it('User is not supplying current password when editing', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).put('/api/user/6295e96d7f984a246108b36d').set({authorization: authToken}).send({nationality: "nl"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(401);
                done();
            })
        })
        it('User is not supplying correct password when editing', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).put('/api/user/6295e96d7f984a246108b36d').set({authorization: authToken}).send({nationality: "nl", passwordInfo: {currentPassword: "Morbius13"}
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(403);
                done();
            })
        })
        it('User cannot affect restricted fields when editing', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).put('/api/user/6295e96d7f984a246108b36d').set({authorization: authToken}).send({firstName: "Zingzabinga", passwordInfo: {currentPassword: "Secret22"}
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                res.body.result.firstName.should.not.equal("Zingzabinga");
                done();
            })
        })
    })
    describe('Non-existant user', () => {
        it('User ID does not match spec on /activate', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36f", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).post('/api/user/blabla/activate').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal("invalid_parameters")
                done();
            })
        })
        it('User ID does not match spec on /deactivate', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36f", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).post('/api/user/blabla/deactivate').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal("invalid_parameters")
                done();
            })
        })
        it('User does not exist on /activate', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).post('/api/user/6295e96d7f984a246108b89d/deactivate').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                done();
            })
        })
        it('User does not exist on PUT /api/user/:userId', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36a", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).put('/api/user/6295e96d7f984a246108b36a').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                done();
            })
        })
    })
    describe('Success Cases', () => {
        it('User can be succesfully activated!', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).post('/api/user/6295e96d7f984a246108b36d/activate').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                done();
            })
        })
        it('User can be succesfully deactivated', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36f", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).post('/api/user/6295e96d7f984a246108b36d/deactivate').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                done();
            })
        })
        it('Users can be retrieved', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).get('/api/user').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                res.body.result.length.should.be.greaterThan(1);
                done();
            })
        })
        it('Two Users can be retrieved', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).get('/api/user?lastName=Mama').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                res.body.result.length.should.equal(2);
                done();
            })
        })
        it('One User can be retrieved', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).get('/api/user?firstName=Joe').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                res.body.result.length.should.equal(1);
                done();
            })
        })
        it('Own User can be retrieved', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).get('/api/user/@me').set({authorization: authToken}).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                res.body.result.firstName.should.equal("Joe");
                done();
            })
        })
        it('User can edit their own data ', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36d", role: "user"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).put('/api/user/6295e96d7f984a246108b36d').set({authorization: authToken}).send({emailCampaigns: true, passwordInfo: {currentPassword: "Secret22"}
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                res.body.result.emailCampaigns.should.equal(true);
                done();
            })
        })
        it('Owner can edit another user\'s data ', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36f", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).put('/api/user/6295e96d7f984a246108b36d').set({authorization: authToken}).send({gender: "m"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                res.body.result.gender.should.equal("m");
                done();
            })
        })
        it('Owner can edit another user\'s priviliged fields ', (done)=>{
            const authToken = jwt.sign({id: "6295e96d7f984a246108b36f", role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"})

            chai.request(server).put('/api/user/6295e96d7f984a246108b36d').set({authorization: authToken}).send({firstName: "Aang"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(200);
                res.body.result.firstName.should.equal("Aang");
                done();
            })
        })
    })
})

