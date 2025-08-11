import re

# Read the file
with open('api/server/controllers/lms/ForumController.js', 'r') as f:
    content = f.read()

# Find the deleteReply method and replace it
start = content.find('  async deleteReply')
if start == -1:
    start = content.find('async deleteReply')

if start != -1:
    # Find the end of the method
    lines = content.split('\n')
    start_line = 0
    for i, line in enumerate(lines):
        if 'async deleteReply' in line:
            start_line = i
            break
    
    # Find the end of the method
    brace_count = 0
    end_line = start_line
    for i in range(start_line, len(lines)):
        line = lines[i]
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if brace_count == 0:
            end_line = i
            break
    
    # Create new content
    new_lines = lines[:start_line] + [
        '  async deleteReply(req, res) {',
        '    try {',
        '      const { replyId } = req.params;',
        '      const userId = req.user.id;',
        '      ',
        '      const ForumReply = require("~/models/ForumReply");',
        '      const reply = await ForumReply.findById(replyId);',
        '      ',
        '      if (!reply) return res.status(404).json({ error: "Reply not found" });',
        '      ',
        '      if (reply.author.toString() !== userId && req.user.role !== SystemRoles.ADMIN) {',
        '        return res.status(403).json({ error: "Not authorized" });',
        '      }',
        '      ',
        '      reply.deletedAt = new Date();',
        '      reply.deletedBy = userId;',
        '      await reply.save();',
        '      ',
        '      res.json({ success: true, message: "Reply deleted" });',
        '    } catch (error) {',
        '      res.status(500).json({ error: "Failed to delete reply" });',
        '    }',
        '  },'
    ] + lines[end_line+1:]
    
    new_content = '\n'.join(new_lines)
    
    with open('api/server/controllers/lms/ForumController.js', 'w') as f:
        f.write(new_content)
    
    print('Fixed deleteReply method')
else:
    print('Could not find deleteReply method')
