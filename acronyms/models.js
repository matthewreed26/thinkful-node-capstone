const mongoose = require('mongoose');

const AcronymSchema = mongoose.Schema({
  acronym: {
    type: String, 
    required: true
  },
  definition: {
    type: String, 
    required: true
  }
});

AcronymSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    acronym: this.acronym,
    definition: this.definition
  };
};

const Acronym = mongoose.model('Acronym', AcronymSchema);

module.exports = {Acronym};
