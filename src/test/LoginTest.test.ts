import chaiHttp from "chai-http";
import chai from "chai";
import mochas, { it } from 'mocha';
import server from '../index';

chai.should();
chai.use(chaiHttp);

describe('A user can log in, with his registered account.', ()=>{
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
                emailAddress: "geoffreywesthoff@gmail.com",
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
                emailAddress: "Dummy2Data@gmail.com",
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
                emailAddress: "dummy@outlook.com",
                password: "Secret22"
            }).end((err, res)=>{
                let {status, result} = res.body;
                status.should.be.equal(200);

                done();
            })
        })
    })
})

