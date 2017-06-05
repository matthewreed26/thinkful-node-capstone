const mongoose = require('mongoose');

const acronymsSchema = mongoose.Schema({
  acronym: {type: String, required: true},
  definition: {type: String, required: true}
});

acronymsSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    acronym: this.acronym,
    definition: this.definition
  };
};

const Acronyms = mongoose.model('Acronyms', acronymsSchema);

module.exports = {Acronyms};
