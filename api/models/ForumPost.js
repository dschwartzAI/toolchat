const mongoose = require('mongoose');
const forumPostSchema = require('~/packages/data-schemas/src/schema/lms/forumPost');

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

module.exports = ForumPost;