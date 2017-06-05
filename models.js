const mongoose = require('mongoose');

const acronymsSchema = mongoose.Schema({
  acronym: {type: String, required: true},
  definition: {type: String, required: true},
  category: {type: String, required: true},
  notes: {type: String, required: false}
});

acronymsSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    acronym: this.acronym,
    definition: this.definition,
    category: this.category,
    notes: this.notes
  };
};

const Acronyms = mongoose.model('Acronyms', acronymsSchema);

module.exports = {Acronyms};