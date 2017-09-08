const express = require('express');
const passport = require('passport');
const router = express.Router();
const {Acronym} = require('./models');

router.get('/',
    passport.authenticate('jwt', {session: false}), 
    (req, res) => {
  Acronym.find().exec().then(Acronym =>
    res.json(Acronym.map(acronym => acronym.apiRepr()))
  ).catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal server error'});
  });
});

router.get('/:id', 
    passport.authenticate('jwt', {session: false}), 
    (req, res) => {
  Acronym.findById(req.params.id).exec().then(acronym =>
    res.json(acronym.apiRepr())
  ).catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal server error'});
  });
});

router.post('/', 
    passport.authenticate('jwt', {session: false}), 
    (req, res) => {
  const requiredFields = ['acronym', 'definition'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }
  Acronym.create({
    acronym: req.body.acronym,
    definition: req.body.definition
  }).then(
    acronym => res.status(201).json(acronym.apiRepr())
  ).catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal server error'});
  });
});

router.put('/:id', 
    passport.authenticate('jwt', {session: false}), 
    (req, res) => {
  const requiredFields = ['acronym', 'definition'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id `
      `(${req.body.id}) must match`);
    console.error(message);
    return res.status(400).send(message);
  }
  console.log(`Updating Acronym \`${req.params.id}\``);
  Acronym.findByIdAndUpdate(req.params.id, {$set: {
    id: req.params.id,
    acronym: req.body.acronym,
    definition: req.body.definition
  }}).exec().then(acronym => {
    console.log(`Updated Acronym \`${acronym.id}\``);
    res.status(201).json(acronym.apiRepr());
  }).catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal server error'});
  });
});

router.delete('/:id', 
    passport.authenticate('jwt', {session: false}), 
    (req, res) => {
  console.log(`Deleting Acronym \`${req.params.id}\``);
  Acronym.findByIdAndRemove(req.params.id).exec().then(acronym => {
    console.log(`Deleted Acronym \`${acronym.id}\``);
    res.status(204).end();
  }).catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal server error'});
  });
});

// catch-all endpoint if client makes request to non-existent endpoint
router.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});


module.exports = {router};
