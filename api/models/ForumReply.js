const mongoose = require('mongoose');
const forumReplySchema = require('~/packages/data-schemas/src/schema/lms/forumReply');

const ForumReply = mongoose.model('ForumReply', forumReplySchema);

module.exports = ForumReply;