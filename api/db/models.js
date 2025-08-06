const mongoose = require('mongoose');
const { createModels } = require('@librechat/data-schemas');
const models = createModels(mongoose);

// Import custom models
const ForumPost = require('~/models/ForumPost');
const ForumCategory = require('~/models/ForumCategory');
const ForumReply = require('~/models/ForumReply');

module.exports = { 
  ...models,
  ForumPost,
  ForumCategory,
  ForumReply
};
