const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import models
const User = require('../models/User');
const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const ForumCategory = require('../models/ForumCategory');

const seedForumData = async () => {
  try {
    console.log('Starting forum data seeding...');

    // Find or create test users
    let users = await User.find().limit(3);
    
    if (users.length === 0) {
      console.log('No users found. Please create at least one user first.');
      return;
    }

    const [user1, user2, user3] = users;
    console.log(`Using ${users.length} existing users for seeding`);

    // Create forum categories first
    console.log('Creating forum categories...');
    const categories = [
      { _id: 'general', name: 'General Discussion', description: 'General Academy discussion', order: 1 },
      { _id: 'questions', name: 'Questions & Help', description: 'Ask questions and get help', order: 2 },
      { _id: 'success-stories', name: 'Success Stories', description: 'Share your wins and achievements', order: 3 },
      { _id: 'resources', name: 'Resources & Tools', description: 'Share useful resources and tools', order: 4 },
      { _id: 'announcements', name: 'Announcements', description: 'Official Academy announcements', order: 5 }
    ];

    // Drop and recreate the collection to clear any existing indexes
    try {
      await ForumCategory.collection.drop();
      console.log('Dropped forum categories collection');
    } catch (error) {
      console.log('Forum categories collection did not exist, continuing...');
    }

    // Create categories
    const createdCategories = {};
    for (const categoryData of categories) {
      const category = await ForumCategory.create(categoryData);
      createdCategories[categoryData._id] = category._id;
    }
    console.log('Created forum categories');

    // Clear existing forum data to start fresh with new structure
    await ForumPost.deleteMany({});
    await ForumReply.deleteMany({});
    console.log('Cleared existing forum data');

    // Create sample posts
    const posts = [];

    // Post 1: Getting Started Guide
    const post1 = await ForumPost.create({
      title: 'Welcome to the Academy Forum! Getting Started Guide',
      content: `## Welcome to our learning community!

This forum is your space to connect with fellow learners, share insights, and get help when you need it. Here's how to make the most of it:

### 📚 Forum Guidelines
1. **Be respectful** - We're all here to learn and grow
2. **Search before posting** - Someone might have already asked your question
3. **Share your wins** - Celebrate your progress and inspire others
4. **Help others** - Teaching is one of the best ways to learn

### 🎯 How to Use the Forum Effectively
- Use descriptive titles for your posts
- Include relevant details when asking questions
- Mark helpful replies to help others find solutions
- Engage with the community regularly

### 🚀 Quick Tips
- You can format your posts using Markdown
- Upload images to illustrate your points
- Tag relevant topics to help others find your posts
- Check back for replies and continue the conversation

Looking forward to learning together!`,
      author: user1._id,
      category: 'announcements',
      tags: ['welcome', 'guidelines', 'getting-started'],
      isPinned: true,
      views: 245,
      likes: [user2._id, user3._id],
      likeCount: 2,
      replyCount: 0
    });
    posts.push(post1);
    console.log('Created pinned welcome post');

    // Post 2: Technical Question
    const post2 = await ForumPost.create({
      title: 'How do you stay motivated during long learning sessions?',
      content: `Hey everyone! 

I've been working through the modules and finding it challenging to maintain focus during longer study sessions. I usually start strong but after about an hour, my concentration starts to wane.

**What I've tried so far:**
- Taking regular breaks (Pomodoro technique)
- Switching between different types of content
- Setting small goals for each session

**My current challenges:**
- Getting distracted by notifications
- Feeling overwhelmed by the amount of material
- Losing track of progress

I'd love to hear what strategies work for you all. How do you structure your learning time? Any tools or techniques you recommend?

Thanks in advance for your insights! 🙏`,
      author: user2._id,
      category: 'questions',
      tags: ['productivity', 'study-tips', 'motivation'],
      views: 89,
      likes: [user1._id],
      likeCount: 1,
      replyCount: 0
    });
    posts.push(post2);
    console.log('Created motivation question post');

    // Post 3: Success Story
    const post3 = await ForumPost.create({
      title: '🎉 Just completed my first major project using the Academy teachings!',
      content: `I'm so excited to share this with you all!

After 3 months of learning and applying the strategies from the Academy, I just landed my first major client project! Here's what made the difference:

### Key Learnings Applied:
1. **Value-first approach** - I focused on understanding the client's real problems
2. **Clear communication** - Used the frameworks from Module 3 to present my ideas
3. **Systematic process** - Followed the project management template step-by-step

### Results:
- **Project value**: $5,000 (my biggest yet!)
- **Timeline**: Completed in 2 weeks
- **Client feedback**: "Exceeded expectations"

### My Top 3 Tips for Others:
1. Don't wait until you feel "ready" - start applying what you learn immediately
2. Document everything - it helps with both learning and client communication
3. Engage with this community - the feedback has been invaluable

Thank you to everyone who answered my questions along the way. This community is amazing! 

What wins are you celebrating this week? Let's keep the momentum going! 💪`,
      author: user3._id,
      category: 'success-stories',
      tags: ['success-story', 'wins', 'client-work', 'motivation'],
      views: 156,
      likes: user1._id === user3._id ? [user2._id] : [user1._id, user2._id],
      likeCount: user1._id === user3._id ? 1 : 2,
      replyCount: 0
    });
    posts.push(post3);
    console.log('Created success story post');

    // Post 4: Resource Sharing
    const post4 = await ForumPost.create({
      title: 'Useful Tools and Resources for Implementing Academy Strategies',
      content: `Hi everyone! I've been collecting tools that help implement what we're learning. Thought I'd share my list:

## 📊 Project Management
- **Notion** - Great for organizing notes and projects
- **Trello** - Visual task management
- **Asana** - Good for team collaboration

## 💡 Idea Development
- **Miro** - Visual brainstorming and mind mapping
- **Whimsical** - Quick flowcharts and wireframes
- **Obsidian** - Connected note-taking

## 📈 Analytics & Tracking
- **Google Analytics** - Website metrics
- **Hotjar** - User behavior insights
- **Mixpanel** - Product analytics

## 🎨 Content Creation
- **Canva** - Quick graphics
- **Loom** - Screen recording for client updates
- **Figma** - Design and prototyping

## 🤖 Automation
- **Zapier** - Connect different tools
- **Make (Integromat)** - Complex automations
- **IFTTT** - Simple if-this-then-that rules

What tools are you using? Any recommendations to add to this list?

Let's build a comprehensive resource together! 🛠️`,
      author: user1._id,
      category: 'resources',
      tags: ['resources', 'tools', 'productivity'],
      views: 203,
      likes: user2._id === user1._id ? [] : [user2._id],
      likeCount: user2._id === user1._id ? 0 : 1,
      replyCount: 0
    });
    posts.push(post4);
    console.log('Created resource sharing post');

    // Post 5: Discussion Topic
    const post5 = await ForumPost.create({
      title: 'The importance of building in public - who else is doing this?',
      content: `I've been thinking about the "build in public" philosophy after Module 5's discussion on transparency and accountability.

**The concept**: Share your journey, progress, and even failures publicly as you build your business.

**Potential benefits I see:**
- Accountability to keep going
- Feedback from potential customers
- Building an audience before launch
- Learning from others' experiences
- Networking opportunities

**My concerns:**
- Fear of criticism
- Competitors stealing ideas
- Pressure to always show progress
- Time investment in sharing

I'm considering starting a weekly blog or Twitter thread about my progress. 

**Questions for the community:**
1. Is anyone here building in public?
2. What platforms/methods do you use?
3. How do you balance sharing vs. doing the actual work?
4. Any unexpected benefits or drawbacks?

Would love to hear different perspectives on this!`,
      author: user2._id,
      category: 'general',
      tags: ['discussion', 'building-in-public', 'marketing', 'community'],
      views: 127,
      likes: [],
      likeCount: 0,
      replyCount: 0
    });
    posts.push(post5);
    console.log('Created discussion topic post');

    // Now create replies for some posts to create discussion threads
    console.log('\nCreating replies and discussion threads...');

    // Replies for Post 2 (Motivation question)
    const reply1 = await ForumReply.create({
      content: `Great question! I've struggled with this too. Here's what's been working for me:

**Time blocking** has been a game-changer. I schedule specific times for learning and treat them like important meetings. I also use the **2-minute rule** - if something takes less than 2 minutes, I do it immediately to avoid mental clutter.

For notifications, I use Focus mode on my devices during study time. It's amazing how much more I can concentrate without the constant pings!

One trick that really helps: I always end my sessions by writing down exactly where I'll start next time. Makes it so much easier to jump back in.

Hope this helps! 💪`,
      author: user3._id,
      post: post2._id,
      likes: [user2._id],
      likeCount: 1
    });

    const reply2 = await ForumReply.create({
      content: `Following this thread! I've been experimenting with different approaches too.

Something that's helped me is **changing locations**. I have different spots for different types of learning:
- Coffee shop for reading/research
- Home office for hands-on practice
- Library for deep focus work

Also, I've started using **background music** specifically designed for focus. Brain.fm has been great for this.

What about accountability partners? Anyone tried that approach?`,
      author: user1._id,
      post: post2._id,
      likes: [user2._id, user3._id],
      likeCount: 2
    });

    // Nested reply to reply2
    const reply2_1 = await ForumReply.create({
      content: `Yes! Accountability partners are amazing! I have a study buddy from this forum actually. We do weekly check-ins and it's been super helpful for staying on track.

We share our goals for the week and then report back on progress. The gentle peer pressure really works 😄`,
      author: user2._id,
      post: post2._id,
      parentReply: reply2._id,
      likes: [user1._id],
      likeCount: 1
    });

    // Update parent reply with nested reply
    await ForumReply.findByIdAndUpdate(reply2._id, {
      $push: { replies: reply2_1._id }
    });

    // Update post with reply count
    await ForumPost.findByIdAndUpdate(post2._id, {
      replyCount: 3,
      lastReplyAt: new Date(),
      lastReplyBy: user2._id
    });

    console.log('Created discussion thread for motivation post');

    // Replies for Post 3 (Success story)
    const reply3 = await ForumReply.create({
      content: `Congratulations! 🎉 This is so inspiring!

I'm curious about the value-first approach you mentioned. How did you position yourself during the initial client conversations? Did you offer a free consultation or strategy session first?

I'm at the stage where I'm ready to start reaching out to potential clients but not sure how to demonstrate value upfront without giving everything away for free.

Your success gives me hope that I'm on the right track! 🚀`,
      author: user1._id,
      post: post3._id,
      likes: [user3._id],
      likeCount: 1
    });

    const reply4 = await ForumReply.create({
      content: `This is exactly what I needed to read today! I've been hesitating to reach out to potential clients because I don't feel "expert enough" yet.

Your point about not waiting until you feel ready really resonates. I'm going to set a goal to reach out to 5 potential clients this week.

Quick question: How did you handle pricing? Did you use the pricing framework from Module 4?

Congrats again! 🙌`,
      author: user2._id,
      post: post3._id,
      likes: [user3._id, user1._id],
      likeCount: 2
    });

    // Reply from post author
    const reply5 = await ForumReply.create({
      content: `Thank you both for the kind words! Happy to share more details:

@${users[0].name} - Yes, I did offer a free 30-minute strategy session! I used it to:
1. Understand their biggest pain points
2. Share 1-2 quick wins they could implement immediately  
3. Outline how a fuller engagement could help

The key was giving enough value to show expertise but leaving them wanting more.

@${users[1].name} - Yes! The Module 4 pricing framework was super helpful. I actually priced myself a bit higher than I was comfortable with (following the advice) and the client didn't even negotiate!

You've got this! Feel free to DM me if you want to practice your pitch. Happy to help! 🤝`,
      author: user3._id,
      post: post3._id,
      likes: [user1._id, user2._id],
      likeCount: 2
    });

    await ForumPost.findByIdAndUpdate(post3._id, {
      replyCount: 3,
      lastReplyAt: new Date(),
      lastReplyBy: user3._id
    });

    console.log('Created discussion thread for success story');

    // Replies for Post 5 (Building in public)
    const reply6 = await ForumReply.create({
      content: `I've been building in public for 6 months now! It's been transformative for my business.

**My approach:**
- Daily tweets about what I'm working on
- Weekly LinkedIn posts with lessons learned
- Monthly blog post with detailed metrics

**Unexpected benefits:**
- Clients reaching out to ME (inbound leads!)
- Partnerships with other builders
- Early user feedback that saved me from building the wrong features
- A support network when things get tough

**The drawbacks are real though:**
- Some days you have nothing interesting to share
- Negative comments can sting
- It IS time-consuming

But overall, 100% worth it. The connections alone have made it valuable.

I'd say start small - maybe just weekly updates - and see how it feels?`,
      author: user1._id,
      post: post5._id,
      likes: [user2._id],
      likeCount: 1
    });

    // Nested discussion
    const reply7 = await ForumReply.create({
      content: `This is really helpful! I love the graduated approach - daily, weekly, monthly for different platforms.

How do you handle sharing failures or setbacks? That's the part that scares me most.`,
      author: user2._id,
      post: post5._id,
      parentReply: reply6._id,
      likes: [user1._id],
      likeCount: 1
    });

    const reply8 = await ForumReply.create({
      content: `Great question! Sharing failures was scary at first, but it's actually where I get the most engagement and support.

I frame them as "lessons learned" and always include:
1. What went wrong
2. Why it happened
3. What I'm doing differently

People really appreciate the honesty. Some of my "failure posts" have led to the best connections - people reaching out with advice or similar experiences.

The key is showing that you're learning and adapting, not just complaining 😊`,
      author: user1._id,
      post: post5._id,
      parentReply: reply7._id,
      likes: [user2._id],
      likeCount: 1
    });

    // Update parent replies
    await ForumReply.findByIdAndUpdate(reply6._id, {
      $push: { replies: reply7._id }
    });
    
    await ForumReply.findByIdAndUpdate(reply7._id, {
      $push: { replies: reply8._id }
    });

    await ForumPost.findByIdAndUpdate(post5._id, {
      replyCount: 3,
      lastReplyAt: new Date(),
      lastReplyBy: user1._id
    });

    console.log('Created discussion thread for building in public post');

    // Add one more standalone reply to the resources post
    const reply9 = await ForumReply.create({
      content: `Great list! I'd add a few more that have been game-changers for me:

**Communication:**
- **Calendly** - Scheduling without the back-and-forth
- **Krisp** - Noise cancellation for client calls
- **Grammarly** - Polished written communication

**Learning & Development:**
- **Readwise** - Resurfaces highlights from books and articles
- **Anki** - Spaced repetition for remembering key concepts

**Client Management:**
- **Bonsai** - Contracts, invoices, and project management in one
- **Toggl** - Time tracking that doesn't get in the way

Thanks for starting this thread! Bookmarking for future reference 📌`,
      author: user2._id,
      post: post4._id,
      likes: [user1._id],
      likeCount: 1
    });

    await ForumPost.findByIdAndUpdate(post4._id, {
      replyCount: 1,
      lastReplyAt: new Date(),
      lastReplyBy: user2._id
    });

    console.log('Added reply to resources post');

    console.log('\n✅ Forum seeding completed successfully!');
    console.log(`Created ${posts.length} posts and multiple discussion threads`);
    console.log('\nForum Statistics:');
    console.log('- Total Posts: 5');
    console.log('- Total Replies: 9 (including nested replies)');
    console.log('- Pinned Posts: 1');
    console.log('- Active Discussions: 4');

  } catch (error) {
    console.error('Error seeding forum data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the seeding
connectDB().then(() => {
  seedForumData();
});