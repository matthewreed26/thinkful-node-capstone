const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const faker = require('faker');
const mongoose = require('mongoose');

const {Acronym} = require('../acronyms/models');
const {app, runServer, closeServer} = require('../server');
const {User} = require('../users');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');


// this lets us use *should* style syntax in our tests
// so we can do things like `(1 + 1).should.equal(2);`
// http://chaijs.com/api/bdd/
const should = chai.should();

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedAcronymData() {
  console.info('seeding acronym data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push({'acronym':faker.random.word(), 'definition':faker.random.words()});
  }
  // this will return a promise
  return Acronym.insertMany(seedData);
}

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure  ata from one test does not stick
// around for next one
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Acronym Finder', function() {
  const expectedKeys = ['id', 'acronym', 'definition'];
  const username = 'exampleUser';
  const password = 'examplePass';
  const firstName = 'Example';
  const lastName = 'User';

  // Before our tests run, we activate the server. Our `runServer`
  // function returns a promise, and we return the that promise by
  // doing `return runServer`. If we didn't return a promise here,
  // there's a possibility of a race condition where our tests start
  // running before our server has started.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedAcronymData();
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password =>
      User.create({
        username,
        password,
        firstName,
        lastName
      })
    );
  });

  afterEach(function() {
    return tearDownDb();
  });

  afterEach(function() {
    return User.remove({});
  });

  // although we only have one test module at the moment, we'll
  // close our server at the end of these tests. Otherwise,
  // if we add another test module that also has a `before` block
  // that starts our server, it will cause an error because the
  // server would still be running from the previous tests.
  after(function() {
    return closeServer();
  });
  
  
  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function() {
    let token = jwt.sign({
      user: {
        username,
        firstName,
        lastName
      },
    }, JWT_SECRET, {
      algorithm: 'HS256',
      subject: username,
      expiresIn: '7d'
    });
  
    it('should list acronyms on GET', function() {
      // strategy:
      //    1. get back all acronyms returned by by GET request to `/api/acronyms`
      //    2. prove res has right status, data type
      //    3. prove the number of acronyms we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/api/acronyms')
        .set('authorization', `Bearer ${token}`)
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);
          return Acronym.count();
        })
        .then(function(count){
          res.body.should.have.length.of(count);
        });
    });
    
    it('should list acronyms with right fields', function() {
      // Strategy: Get back all acronyms, and ensure they have expected keys
      let resAcronym;
      return chai.request(app)
        .get('/api/acronyms')
        .set('authorization', `Bearer ${token}`)
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);
          // each item should be an object with key/value pairs
          // for `id`, `acronym` and `definition`.
          res.body.forEach(function(acronym) {
            acronym.should.be.a('object');
            acronym.should.include.keys(expectedKeys);
          });
          resAcronym = res.body[0];
          return Acronym.findById(resAcronym.id);
        })
        .then(function(acronym){
          resAcronym.id.should.equal(acronym.id);
          resAcronym.acronym.should.equal(acronym.acronym);
          resAcronym.definition.should.equal(acronym.definition);
        });
    });
  });

  describe('POST endpoint', function() {
    let token = jwt.sign({
      user: {
        username,
        firstName,
        lastName
      },
    }, JWT_SECRET, {
      algorithm: 'HS256',
      subject: username,
      expiresIn: '7d'
    });
    
    // strategy: make a POST request with data,
    // then prove that the acronym we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add an acronym on POST', function() {
      const newAcronym = {'acronym': faker.random.word(), 'definition': faker.random.words()};
      console.info('POST newAcronym: '+JSON.stringify(newAcronym));
      return chai.request(app)
        .post('/api/acronyms')
        .send(newAcronym)
        .set('authorization', `Bearer ${token}`)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(expectedKeys);
          res.body.id.should.not.be.null;
          res.body.acronym.should.equal(newAcronym.acronym);
          res.body.definition.should.equal(newAcronym.definition);
          return Acronym.findById(res.body.id);
        })
        .then(function(acronym){
          acronym.acronym.should.equal(newAcronym.acronym);
          acronym.definition.should.equal(newAcronym.definition);
        });
    });
  });

  describe('PUT endpoint', function() {
    let token = jwt.sign({
      user: {
        username,
        firstName,
        lastName
      },
    }, JWT_SECRET, {
      algorithm: 'HS256',
      subject: username,
      expiresIn: '7d'
    });

    // strategy:
    //  1. Get an existing acronym from db
    //  2. Make a PUT request to update that acronym
    //  3. Prove acronym returned by request contains data we sent
    //  4. Prove acronym in db is correctly updated
    it('should update acronyms on PUT', function() {
      // we initialize our updateData here and then after the initial
      // request to the app, we update it with an `id` property so
      // we can make a second, PUT call to the app.
      const updateAcronym = {'acronym': faker.random.word(), 'definition': faker.random.words()};
      console.info('PUT updateAcronym: '+JSON.stringify(updateAcronym));
      return Acronym
        .findOne()
        .then(function(acronym) {
          updateAcronym.id = acronym.id;
          // this will return a promise whose value will be the response
          // object, which we can inspect in the next `then` back. Note
          // that we could have used a nested callback here instead of
          // returning a promise and chaining with `then`, but we find
          // this approach cleaner and easier to read and reason about.
          return chai.request(app)
            .put(`/api/acronyms/${updateAcronym.id}`)
            .send(updateAcronym)
            .set('authorization', `Bearer ${token}`);
        })
        // prove that the PUT request has right status code
        // and returns updated item
        .then(function(res) {
          res.should.have.status(200);
          return Acronym.findById(updateAcronym.id);
        })
        .then(function(acronym){
          acronym.acronym.should.equal(updateAcronym.acronym);
          acronym.definition.should.equal(updateAcronym.definition);
        });
    });
  });

  describe('DELETE endpoint', function() {
    let token = jwt.sign({
      user: {
        username,
        firstName,
        lastName
      },
    }, JWT_SECRET, {
      algorithm: 'HS256',
      subject: username,
      expiresIn: '7d'
    });
      
    // strategy:
    //  1. get a acronym
    //  2. make a DELETE request for that acronym's id
    //  3. assert that response has right status code
    //  4. prove that acronym with the id doesn't exist in db anymore
    it('should delete acronyms on DELETE', function() {
      let acronym;
      
      return Acronym
        .findOne()
        .then(function(_acronym){
          acronym = _acronym;
          return chai.request(app).delete(`/api/acronyms/${acronym.id}`)
          .set('authorization', `Bearer ${token}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return Acronym.findById(acronym.id)
        })
        .then(function(_acronym){
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_acronym.should.be.null` would raise
          // an error. `should.be.null(_acronym)` is how we can
          // make assertions about a null value.
          should.not.exist(_acronym);
        });
    });
  });
});
