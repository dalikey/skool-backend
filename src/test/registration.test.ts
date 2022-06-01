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

describe('A user can register their own account.', ()=>{
    describe('Input failure cases', ()=>{

        it('Body is empty', (done)=>{
            chai.request(server).post('/api/auth/register').send({
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal('input_invalid');
                done();
            })
        })

        it('Email does not match specifications', (done)=>{
            chai.request(server).post('/api/auth/register').send({
                emailAddress: "test@.nl",
                password: "TestPassword1234",
                firstName: "John",
                lastName: "Doe"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal('input_invalid');
                done();
            })
        })

        it('Password confirmation does not match', (done)=>{
            chai.request(server).post('/api/auth/register').send({
                emailAddress: "test@example.com",
                password: "StrongPassword1234",
                passwordConfirm: "DifferentPassword1234",
                firstName: "John",
                lastName: "Doe"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal('input_invalid');
                done();
            })
        })

        it('Password does not contain a number', (done)=>{
            chai.request(server).post('/api/auth/register').send({
                emailAddress: "test@example.com",
                password: "weakpassword",
                passwordConfirm: "weakpassword",
                firstName: "John",
                lastName: "Doe"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal('input_invalid');
                done();
            })
        })

        it('Password is less than 8 characters', (done)=>{
            chai.request(server).post('/api/auth/register').send({
                emailAddress: "test@example.com",
                password: "Weak1",
                passwordConfirm: "Weak1",
                firstName: "John",
                lastName: "Doe"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal('input_invalid');
                done();
            })
        })

        it('Password does not contain a capital letter', (done)=>{
            chai.request(server).post('/api/auth/register').send({
                emailAddress: "test@example.com",
                password: "weakpassword1234",
                passwordConfirm: "weakpassword1234"
            }).end((err, res)=>{
                let { error } = res.body;
                res.status.should.equal(400);
                error.should.equal('input_invalid');
                done();
            })
        })

    })
    describe("Duplicate User failure", ()=> {
        before( async () => {
            const conn = await client.connect();
            const collection = conn.db(skoolWorkshop).collection('user');
            const result = await collection.insertOne({emailAddress: "registered@example.com",
                password: "NotARealPasswordHash",
                firstName: "Reserved User", lastName: "Reserved User"});
            console.log(result);
        })
        after( async () => {
            const conn = await client.connect();
            const collection = conn.db(skoolWorkshop).collection('user');
            const result = await collection.deleteOne({emailAddress: "registered@example.com"});
            console.log(result);
        })
        it('An already registered user cannot re-register', (done)=>{
            chai.request(server).post('/api/auth/register').send({
                emailAddress: "registered@example.com",
                password: "StrongPassword1234",
                passwordConfirm: "StrongPassword1234",
                firstName: "Reserved User",
                lastName: "Reserved User"
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

