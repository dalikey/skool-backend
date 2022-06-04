import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";

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
                emailAddress: "emptyPassword@example.com",
            }).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("wrong_input");
                message.should.be.equal('Password must be filled in.');
                done();
            })
        })

        it('Empty emailAddress field, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                password: "dummy"
            }).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("wrong_input");
                message.should.be.equal('email must be filled in.');
                done();
            })
        })

        it('User does not exist, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                emailAddress: "UserDoesNotExist@example.com",
                password: "Secerio"
            }).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("login_failure");
                message.should.be.equal('Login failed.');
                done();
            })
        })

        it('Password is incorrect, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                emailAddress: "test@invalid.com",
                password: "Secerio"
            }).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("login_failure");
                message.should.be.equal('Login failed.');
                done();
            })
        })

        it('Account is not activated, gives error', (done)=>{
            chai.request(server).post('/api/auth/login').send({
                emailAddress: "test@invalid.com",
                password: "Elegant"
            }).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("login_failure");
                message.should.be.equal('User has not been activated.');
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
                let {result} = res.body;
                assert.deepEqual(result, {
                    firstName: "Test",
                    lastName: "Tester",
                    isActive: true,
                    role: "teacher",
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


//Empty tests. Need to be tested!
describe('A user can reset his password', ()=>{
    before((done)=>[
        queryCommands.getUserCollection().then(collection =>{
            collection.insertOne(dummyUser);
            done();
        })
    ]);

    describe('Send password confirmation email', ()=>{
        it('Empty email field',(done)=>{
            chai.request(server).post("/api/auth/login/forgot").send({}).end((err, result)=>{
                result.body.error.should.be.equal("wrong_input");
                result.body.message.should.be.equal("Empty field");
                done();
            })
        })

        it('Email does not exist',(done)=>{
            chai.request(server).post("/api/auth/login/forgot")
            .send({emailAddress: "sinterklaas@example.com"})
            .end((err, result)=>{
                result.body.error.should.be.equal("retrieval_failure");
                result.body.message.should.be.equal("user does not exist");
                done();
            })
        })

        it('Confirmation mail send', (done)=>{
            chai.request(server)
            .post("/api/auth/login/forgot")
            .send({emailAddress: "test@example.com"})
            .end((err, result)=>{
                result.body.success.should.be.equal(true);
                done();
            })
        })
    })

    describe('Change password, through emaillink',  () => {

        it('No token send', (done) => {
            chai.request(server).put("/api/auth/login/password")
                .set({authorization: ""})
                .send({password: "", passwordConfirm: ""})
                .end((err, result) => {
                    result.body.error.should.be.equal("unauthorized");
                    result.body.message.should.be.equal("You need to provide authorization for this endpoint!");
                    done();
                })
        })

        it('Invalid token', (done) => {
            const nonExistentToken = jwt.sign({pr_uid: 1}, "FakeKey", {expiresIn: 1});
            chai.request(server).put("/api/auth/login/password")
                .set({authorization: nonExistentToken})
                .send({password: "", passwordConfirm: ""})
                .end((err, result) => {
                    result.body.error.should.be.equal("unauthorized");
                    result.body.message.should.be.equal("You need to provide authorization for this endpoint!");
                    done();
                })
        })

        it('Invalid secretKey',  (done) => {
            chai.request(server).put("/api/auth/login/password")
                .set({authorization: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcl91aWQiOiI2MjliNDUyMzAzOGU3MGRkMzhlOWM0MzkiLCJpYXQiOjE2NTQzNDI5NDgsImV4cCI6MTY1NDM0Mjk1M30.aYYRNRhf0GKSrCZXzXx5lTQ5LhhkFIXFPDlSRmjybZg"})
                .send({password: "", passwordConfirm: ""})
                .end((err, result) => {
                    result.body.error.should.be.equal("unauthorized");
                    result.body.message.should.be.equal("You need to provide authorization for this endpoint!");
                    done();
                })
        })

        it('Invalid password format',  (done) => {
           queryCommands.getUserCollection().then(async collection => {
               const user = await collection.findOne({emailAddress: "test@example.com"}, {projection: {passwordResetToken: 1}});
               chai.request(server).put("/api/auth/login/password")
                   .set({authorization: user.passwordResetToken})
                   .send({password: "Secret", passwordConfirm: "Secret"})
                   .end((err, result) => {
                       result.body.error.should.be.equal("password_failure");
                       result.body.message.should.be.equal("Failed to validate passwords");
                       done();
                   })
           })

        })

        it('Invalid password: unequal passwords',  (done) => {
            queryCommands.getUserCollection().then(async collection => {
                const user = await collection.findOne({emailAddress: "test@example.com"}, {projection: {passwordResetToken: 1}});
                chai.request(server).put("/api/auth/login/password")
                    .set({authorization: user.passwordResetToken})
                    .send({password: "Secret12345", passwordConfirm: "Secret6789"})
                    .end((err, result) => {
                        result.body.error.should.be.equal("password_failure");
                        result.body.message.should.be.equal("Failed to validate passwords");
                        done();
                    })
            })
        })

        it('Invalid password: Empty fields',  (done) => {
            queryCommands.getUserCollection().then(async collection => {
                const user = await collection.findOne({emailAddress: "test@example.com"}, {projection: {passwordResetToken: 1}});
                chai.request(server).put("/api/auth/login/password")
                    .set({authorization: user.passwordResetToken})
                    .send({password: "", passwordConfirm: ""})
                    .end((err, result) => {
                        result.body.error.should.be.equal("password_failure");
                        result.body.message.should.be.equal("Failed to validate passwords");
                        done();
                    })
            })
        })

        it('Change password successfully done',  (done) => {
            queryCommands.getUserCollection().then(async collection => {
                const user = await collection.findOne({emailAddress: "test@example.com"}, {projection: {passwordResetToken: 1}});
                chai.request(server).put("/api/auth/login/password")
                    .set({authorization: user.passwordResetToken})
                    .send({password: "Lads_nine_2OnAggregate", passwordConfirm: "Lads_nine_2OnAggregate"})
                    .end((err, result) => {
                        result.body.message.should.be.equal("Update succeeded");
                        done();
                    })
            })
        })
    })

    after((done)=>[
        queryCommands.getUserCollection().then(collection =>{
            collection.deleteMany({emailAddress: {$in: ["test@example.com"]}});
            done();
        })
    ])
})