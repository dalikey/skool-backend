import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';

chai.should();
chai.use(chaiHttp);
const locate= {street_Hnr: "teststreet 111", city: "The Hague", postalcode: "1111BN", country:"The Netherlands"}
const dummyUser = {firstName: "Test", lastName:"Tester", emailAddress: "test@example.com", isActive: true, password: "$2b$09$Yz8.GAGr6qgKDbr1cT/li.26.JvNta5QGfDPMYDgRoC0UAuzvKYda", role: "teacher", contractType: "freelancer", dateOfBirth: "1977-01-01", placeOfBirth: "The Hague", location: locate};
const nonActivatedUser = {firstName: "Prototype", lastName:"Tester", emailAddress: "test@invalid.com", isActive: false,password: "$2b$09$Yz8.GAGr6qgKDbr1cT/li.26.JvNta5QGfDPMYDgRoC0UAuzvKYda", role: "teacher", contractType: "freelancer", dateOfBirth: "1976-01-02", placeOfBirth: "The Hague", location: locate};
describe('A user can log in, with his registered account.', ()=>{
    before((done)=>[
       queryCommands.getUserCollection().then(collection =>{
           collection.insertMany([dummyUser, nonActivatedUser]);
           done();
       })
    ]);
    describe('Failed login', ()=>{
        it('Empty password field, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                emailAddress: "dummyField@outlook.com",
            }).end((err, res)=>{
                let {status, error} = res.body.err;
                status.should.be.equal(401);
                error.should.be.equal('Password must be filled in.');
                done();
            })
        })

        it('Empty emailAddress field, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                password: "dummy"
            }).end((err, res)=>{
                let {status, error} = res.body.err;
                status.should.be.equal(401);
                error.should.be.equal('email must be filled in.');
                done();
            })
        })

        it('User does not exist, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                emailAddress: "dummyField@outlook.com",
                password: "Secerio"
            }).end((err, res)=>{
                let {status, error} = res.body;
                status.should.be.equal(404);
                error.should.be.equal('Login failed.');
                done();
            })
        })

        it('Password is incorrect, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                emailAddress: "test@invalid.com",
                password: "Secerio"
            }).end((err, res)=>{
                let {status, error} = res.body;
                status.should.be.equal(401);
                error.should.be.equal('Login failed.');
                done();
            })
        })

        it('Account is not activated, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                emailAddress: "test@invalid.com",
                password: "Elegant"
            }).end((err, res)=>{
                let {status, error} = res.body;
                status.should.be.equal(400);
                error.should.be.equal('User has not been activated.');
                done();
            })
        })
    })

    describe('Successful login, gives account with token', ()=>{
        it('Successful login', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                emailAddress: "test@example.com",
                password: "Elegant"
            }).end((err, res)=>{
                let {status, result} = res.body;
                status.should.be.equal(200);
                assert.deepEqual(result, {
                    _id: result._id,
                    firstName: "Test",
                    lastName: "Tester",
                    emailAddress: "test@example.com",
                    isActive: true,
                    password: "$2b$09$Yz8.GAGr6qgKDbr1cT/li.26.JvNta5QGfDPMYDgRoC0UAuzvKYda",
                    role: "teacher",
                    contractType: "freelancer",
                    dateOfBirth: "1977-01-01",
                    placeOfBirth: "The Hague",
                    location:{
                        street_Hnr: "teststreet 111",
                        city: "The Hague",
                        postalcode: "1111BN",
                        country:"The Netherlands"
                    },
                    token: result.token
                })
                done();
            })
        })
    })

    after((done)=>[
        queryCommands.getUserCollection().then(collection =>{
            collection.deleteMany({emailAddress: {$in: ["test@example.com","test@invalid.com"]}});
            done();
        })
    ])
})

