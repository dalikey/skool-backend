import chaiHttp from "chai-http";
import chai from "chai";
import {after, before, it} from 'mocha';
import assert from "assert";
import server from '../index';
import {queryCommands} from '../db/databaseCommands';
import jwt from "jsonwebtoken";
import {CustomerBody} from "../models/customerBody";
import {ObjectId} from "mongodb";

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
let WrongCustomer = {
    name: "Mentis ICT Consultancy B.V.",
    phoneNumber:"0611223344" ,
    address: "Hogeschoollaan 12",
    city:"Breda",
    postalCode: "4831SD",
    country: "Nederland"};
let customer2 = {
    _id: new ObjectId("62a5cf4dee6a400654e46b65"),
    name: "GL eighty-six vereniging",
    emailAddress:"86@gmail.com",
    phoneNumber:"0611223344" ,
    address: "Hogeschool Antwerpenplein 12",
    city:"Antwerpen",
    postalCode: "4831SD",
    country: "Niet Nederland"};

let customer3 = {
    _id: new ObjectId("62a5cf46c8b0996fa7218dd2"),
    name: "FvD Alba partij.",
    emailAddress:"alba@gmail.com",
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
            collection.deleteMany({name: {$in: ["Done Institute", "Mentis ICT Consultancy B.V."]}});
            done();
        });
    })
})


describe('Deletion customer', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getCustomerCollection();
        await collection.insertMany([customer2, customer3]);
    })

    after(async ()=>{
        const collection = await queryCommands.getCustomerCollection();
        await collection.deleteMany({_id: {$in: [new ObjectId("62a5cf4dee6a400654e46b65"), new ObjectId("62a5cf46c8b0996fa7218dd2")]}})
    })

    it('No token', (done)=>{
        chai.request(server).delete('/api/customer/62a5cf4dee6a400654e46b65/delete').send(customer).end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You need to provide authorization for this endpoint!');
            done();
        })
    })

    it('Invalid token: not the right role', (done)=>{
        const authToken = jwt.sign({role: "admin"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).delete('/api/customer/62a5cf4dee6a400654e46b65/delete').set({authorization: authToken})
            .send(customer).end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("unauthorized");
                message.should.be.equal('You do not have the right authority.');
                done();
            })
    })
    it('Deletion customer', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).delete('/api/customer/62a5cf4dee6a400654e46b65/delete').set({authorization: authToken})
            .send(customer).end((err, res)=>{
            let {message} = res.body;
            message.should.be.equal('Customer deleted');
            done();
        })
    })
    it('Deletion customer', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).delete('/api/customer/62a5d28ad377dcd720c8d6ce/delete').set({authorization: authToken})
            .send(customer).end((err, res)=>{
            let {message} = res.body;
            message.should.be.equal('Customer does not exist');
            done();
        })
    })
})

describe('Update customer', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getCustomerCollection();
        await collection.insertMany([customer2, customer3]);
    })

    after(async ()=>{
        const collection = await queryCommands.getCustomerCollection();
        await collection.deleteMany({_id: {$in: [new ObjectId("62a5cf4dee6a400654e46b65"), new ObjectId("62a5cf46c8b0996fa7218dd2")]}})
    })

    it('No token', (done)=>{
        chai.request(server).put('/api/customer/62a5cf4dee6a400654e46b65/update').send(customer).end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You need to provide authorization for this endpoint!');
            done();
        })
    })

    it('Invalid token: not the right role', (done)=>{
        const authToken = jwt.sign({role: "admin"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).put('/api/customer/62a5cf4dee6a400654e46b65/update')
            .set({authorization: authToken})
            .send(customer).end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You do not have the right authority.');
            done();
        })
    })
    it('Mandatory field missing', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).put('/api/customer/62a5cf4dee6a400654e46b65/update').set({authorization: authToken})
            .send(WrongCustomer)
            .end((err, res)=>{
                let {error, message} = res.body;
                error.should.be.equal("input_error");
                message.should.be.equal('email issue');
            done();
        })
    })

    it('Update customer', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).put('/api/customer/62a5cf4dee6a400654e46b65/update').set({authorization: authToken})
            .send({
                name: "GL eighty-seven vereniging",
                emailAddress:"86@gmail.com",
                phoneNumber:"0611223344" ,
                address: "Hogeschool Antwerpenplein 12",
                city:"Antwerpen",
                postalCode: "4831SD",
                country: "Niet Nederland"})
            .end((err, res)=>{
                let {message, result} = res.body;
                message.should.be.equal('update completed');
                assert.deepEqual(result, {
                    "_id": "62a5cf4dee6a400654e46b65",
                    "address": "Hogeschool Antwerpenplein 12",
                    "city": "Antwerpen",
                    "contact": {
                        "emailAddress": "86@gmail.com",
                        "phoneNumber": "0611223344"
                    },
                    "country": "Niet Nederland",
                    "emailAddress": "86@gmail.com",
                    "location": {
                        "address": "Hogeschool Antwerpenplein 12",
                        "city": "Antwerpen",
                        "country": "Niet Nederland",
                        "postalCode": "4831SD"
                    },
                    "logo": null,
                    "name": "GL eighty-seven vereniging",
                    "phoneNumber": "0611223344",
                    "postalCode": "4831SD"})
                done();
            })
    })
})

describe('Find one customer', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getCustomerCollection();
        await collection.insertMany([customer2, customer3]);
    })

    after(async ()=>{
        const collection = await queryCommands.getCustomerCollection();
        await collection.deleteMany({_id: {$in: [new ObjectId("62a5cf4dee6a400654e46b65"), new ObjectId("62a5cf46c8b0996fa7218dd2")]}})
    })

    it('No token', (done)=>{
        chai.request(server).get('/api/customer/62a5cf4dee6a400654e46b65/getOne').send(customer).end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You need to provide authorization for this endpoint!');
            done();
        })
    })

    it('Nothing found', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).get('/api/customer/62a5d99a47c8c4d7cf440a8c/getOne').set({authorization: authToken})
            .end((err, res)=>{
                let {message, error} = res.body;
                error.should.be.equal("not_found");
                message.should.be.equal('retrieval has failed');
                done();
            })
    })

    it('Customer found', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).get('/api/customer/62a5cf4dee6a400654e46b65/getOne').set({authorization: authToken})
            .end((err, res)=>{
                let {result} = res.body;
                assert.deepEqual(result, {
                    _id: "62a5cf4dee6a400654e46b65",
                    name: "GL eighty-six vereniging",
                    emailAddress:"86@gmail.com",
                    phoneNumber:"0611223344" ,
                    address: "Hogeschool Antwerpenplein 12",
                    city:"Antwerpen",
                    postalCode: "4831SD",
                    country: "Niet Nederland",
                })
                done();
            })
    })
})
describe('Find all customer', ()=>{
    before(async ()=>{
        const collection = await queryCommands.getCustomerCollection();
        await collection.insertMany([customer2, customer3]);
    })

    after(async ()=>{
        const collection = await queryCommands.getCustomerCollection();
        await collection.deleteMany({_id: {$in: [new ObjectId("62a5cf4dee6a400654e46b65"), new ObjectId("62a5cf46c8b0996fa7218dd2")]}})
    })

    it('No token', (done)=>{
        chai.request(server).get('/api/customer').send(customer).end((err, res)=>{
            let {error, message} = res.body;
            error.should.be.equal("unauthorized");
            message.should.be.equal('You need to provide authorization for this endpoint!');
            done();
        })
    })

    it('Customers found', (done)=>{
        const authToken = jwt.sign({role: "owner"}, process.env.APP_SECRET || "", {expiresIn: "1d"});
        chai.request(server).get('/api/customer').set({authorization: authToken})
            .end((err, res)=>{
                let {result} = res.body;
                assert(result.length >= 2);
                done();
            })
    })
})