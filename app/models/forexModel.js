const mongoose = require('mongoose');

const forexSchema = new mongoose.Schema({
  exchangeName: {
    type: String,
    required: true,
  },
  high: {
    type: Number,
    required: true,
  },
  low: {
    type: Number,
    required: true,
  },
  highY: {
    type: Number,
    required: true,
  },
  lowY: {
    type: Number,
    required: true,
  }
});

module.exports = mongoose.model('Forex', forexSchema);