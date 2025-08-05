const mongoose = require('mongoose');
const moduleSchema = require('~/packages/data-schemas/src/schema/lms/module');

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;