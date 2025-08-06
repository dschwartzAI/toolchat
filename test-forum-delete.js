const axios = require('axios');

async function testForumDelete() {
  try {
    // First, we need to login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3080/api/auth/login', {
      email: 'test@example.com', // Replace with actual credentials
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('2. Got token:', token ? 'Yes' : 'No');
    
    // Get posts to find one to delete
    console.log('3. Getting forum posts...');
    const postsResponse = await axios.get('http://localhost:3080/api/lms/forum/posts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const posts = postsResponse.data.posts;
    console.log('4. Found posts:', posts.length);
    
    if (posts.length > 0) {
      const postToDelete = posts[0];
      console.log('5. Attempting to delete post:', postToDelete._id);
      console.log('   Post title:', postToDelete.title);
      console.log('   Post author:', postToDelete.author);
      
      try {
        const deleteResponse = await axios.delete(
          `http://localhost:3080/api/lms/forum/posts/${postToDelete._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('6. Delete successful:', deleteResponse.data);
      } catch (deleteError) {
        console.error('6. Delete failed:', deleteError.response?.status, deleteError.response?.data);
      }
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the test
testForumDelete();