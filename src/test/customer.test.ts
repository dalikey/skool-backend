import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import {CustomerBody} from "../models/customerBody";

chai.should();
chai.use(chaiHttp);

let customer = {
    name: "Mentis ICT Consultancy B.V.",
    emailAddress:"mentis@gmail.com",
    phoneNumber:"0611223344" ,
    address: "Hogeschoollaan 12",
    city:"Breda",
    postalCode: "4831SD",
    country: "Nederland"};
describe('Creation of customer in the database', ()=>{
    describe('Authorithy issues', ()=> {
        it('No token', (done)=>{
            chai.request(server).post('/api/customer').send(customer).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal('You need to provide authorization for this endpoint!');
                done();
            })
        })
        it('Invalid token: not the right role', (done)=>{
            const authToken = jwt.sign({role: "admin"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/customer').set({authorization: authToken})
                .send(customer).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal('You do not have the right authority.');
                done();
            })
        })

        it('Invalid file upload', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/customer')
                .set({authorization: authToken})
                .field('name', 'test')
                .field('emailAddress', "customer@example.com")
                .field('phoneNumber', '06 45330803')
                .field('address', 'test 12')
                .field('postalcode', "3000 KK")
                .field('city', 'Arnhem')
                .field('country', 'Nederland')
                .attach('images', `${__dirname}/testImage/downloaden (2).png`)
                .end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("file_upload_failure");
                message.should.be.equal('Wrong file insert');
                done();
            })
        })
    })
    ,
        describe('File input', ()=> {
            it('Invalid file input', (done)=>{
                const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
                chai.request(server).post('/api/customer')
                    .set({authorization: authToken})
                    .field('name', 'test')
                    .field('emailAddress', "customer@example.com")
                    .field('phoneNumber', '06 45330803')
                    .field('address', 'test 12')
                    .field('postalcode', "3000 KK")
                    .field('city', 'Arnhem')
                    .field('country', 'Nederland')
                    .attach('images', `${__dirname}/testImage/downloaden (2).png`)
                    .end((err, res)=>{
                        let {error, message} = res.body;
                        error.should.be.equal("file_upload_failure");
                        message.should.be.equal('Wrong file insert');
                        done();
                    })
            })
    })
    ,
        describe('Inputvalidation', ()=> {
            it('No object', (done)=>{
                const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
                chai.request(server).post('/api/customer')
                    .set({authorization: authToken})
                    .attach('image', `${__dirname}/testImage/downloaden (2).png`)
                    .end((err, res)=>{
                        let {error, message} = res.body;
                        error.should.be.equal("input_error");
                        message.should.be.equal('name issue');
                        done();
                    })
            }),
            it('Empty field', (done)=>{
                const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
                chai.request(server).post('/api/customer')
                    .set({authorization: authToken})
                    .field('name', 'test')
                    .field('phoneNumber', '06 45330803')
                    .field('address', 'test 12')
                    .field('postalcode', "3000 KK")
                    .field('city', 'Arnhem')
                    .field('country', 'Nederland')
                    .attach('image', `${__dirname}/testImage/downloaden (2).png`)
                    .end((err, res)=>{
                        let {error, message} = res.body;
                        error.should.be.equal("input_error");
                        message.should.be.equal('email issue');
                        done();
                    })
            })
            it('Invalid email', (done)=>{
                const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
                chai.request(server).post('/api/customer')
                    .set({authorization: authToken})
                    .field('name', 'test')
                    .field('emailAddress', 'test@example.')
                    .field('phoneNumber', '06 45330803')
                    .field('address', 'test 12')
                    .field('postalcode', "3000 KK")
                    .field('city', 'Arnhem')
                    .field('country', 'Nederland')
                    .attach('image', `${__dirname}/testImage/downloaden (2).png`)
                    .end((err, res)=>{
                        let {error, message} = res.body;
                        error.should.be.equal("input_error");
                        message.should.be.equal('email matching issue');
                        done();
                    })
            })

            it('Invalid phone', (done)=>{
                const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
                chai.request(server).post('/api/customer')
                    .set({authorization: authToken})
                    .field('name', 'test')
                    .field('emailAddress', 'test@example.')
                    .field('phoneNumber', '06 453308032')
                    .field('address', 'test 12')
                    .field('postalCode', "3000 KK")
                    .field('city', 'Arnhem')
                    .field('country', 'Nederland')
                    .attach('image', `${__dirname}/testImage/downloaden (2).png`)
                    .end((err, res)=>{
                        let {error, message} = res.body;
                        error.should.be.equal("input_error");
                        message.should.be.equal('email matching issue');
                        done();
                    })
            })
        })
    describe('Insert success', ()=> {
        it('Valid insert', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/customer')
                .set({authorization: authToken})
                .field('name', 'Done Institute')
                .field('emailAddress', 'test@example.com')
                .field('phoneNumber', '06 45330803')
                .field('address', 'test 12')
                .field('postalCode', "3000 KK")
                .field('city', 'Arnhem')
                .field('country', 'Nederland')
                .attach('image', `${__dirname}/testImage/downloaden (2).png`)
                .end((err, res)=>{
                    let {message} = res.body;
                    message.should.be.equal('Customer inserted');
                    done();
                })
        })
        it('Valid insert 2 without image', (done)=>{
            const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
            chai.request(server).post('/api/customer')
                .set({authorization: authToken})
                .send(customer)
                .end((err, res)=>{
                    let {message} = res.body;
                    message.should.be.equal('Customer inserted');
                    done();
                })
        })
    })

    after((done) => {
        queryCommands.getCustomerCollection().then(collection=>{
            collection.deleteMany({name: {$in: ["Done Institute"]}});
            done();
        });
    })
})