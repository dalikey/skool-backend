import chaiHttp from "chai-http";
import chai from "chai";
import mochas, { it } from 'mocha';
import server from '../index';
import {MongoClient} from "mongodb";

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

const testUser = {"emailAddress": "test@example.com", "firstName": "Joe", "lastName": "Mama", role: "user", password: "$2b$06$dG/o1w4WMptTFrWlOpF.8ebOEJzZeonEPDP7g.TEZaUd.7n3ViVcW"}

const adminUser = {"emailAddress": "admin@example.com", "firstName": "Admin", "lastName": "Mama", isActive: true, role: "owner", password: "$2b$06$dG/o1w4WMptTFrWlOpF.8ebOEJzZeonEPDP7g.TEZaUd.7n3ViVcW"}

let authToken: string;
let authTokenAdmin: string;

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

        it('User is not logged in for /api/user/:userId/authorize', (done)=>{
            chai.request(server).get('/api/user/').send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(401);
                done();
            })
        })

        it('User is not logged in for /api/user/:userId/authorize', (done)=>{
            chai.request(server).get('/api/user/').send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(401);
                done();
            })
        })


    })
    describe('Forbidden', () => {
        beforeEach(() => {
            chai.request(server).post('/api/auth/login').send({emailAddress: "test@example.com", password: "Secret22"}).end((err, res) => {
                console.log(res.body.result)
                authToken = res.body.result.token;
            })
            chai.request(server).post('/api/auth/login').send({emailAddress: "admin@example.com", password: "Secret22"}).end((err, res) => {
                console.log(authTokenAdmin);
                authTokenAdmin = res.body.result.token;
            })
        })
        it('User does not belong to role owner', (done)=>{
            chai.request(server).get('/api/user').set("Authorization", authToken).send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal('input_invalid');
                done();
            })
        })
    })
    describe('Successful registration return 204', ()=>{
        after( async () => {
            const conn = await client.connect();
            const collection = conn.db(skoolWorkshop).collection('user');
            await collection.deleteOne({"emailAddress": "test@example.com"});
        })
        it('Successfully registered a new user', (done)=>{
            chai.request(server).post('/api/auth/register').send({
                emailAddress: "test@example.com",
                password: "StrongPassword1234",
                passwordConfirm: "StrongPassword1234",
                firstName: "John",
                lastName: "Doe"
            }).end((err, res)=>{
                res.status.should.equal(204);

                done();
            })
        })
    })
})

