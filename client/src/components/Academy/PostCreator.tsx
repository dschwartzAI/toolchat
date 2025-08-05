import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { cn } from '~/utils';

interface PostCreatorProps {
  categories: Array<{ _id: string; name: string }>;
  onCreatePost: (post: { title: string; content: string; category: string }) => void;
}

const PostCreator: React.FC<PostCreatorProps> = ({ categories, onCreatePost }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = () => {
    if (title.trim() && content.trim() && category) {
      onCreatePost({ title, content, category });
      // Reset form
      setTitle('');
      setContent('');
      setCategory('');
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setCategory('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div className="mb-4">
        <input
          type="text"
          placeholder="Write something..."
          className="w-full px-4 py-3 bg-surface-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          onClick={() => setIsExpanded(true)}
          readOnly
        />
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-text-primary">Create Post</h3>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-surface-hover rounded transition-colors"
        >
          <X className="w-4 h-4 text-text-tertiary" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 bg-surface-primary rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-3 py-2 bg-surface-primary rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="">Select category...</option>
        {categories.map(cat => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>

      <textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-3 py-2 bg-surface-primary rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        rows={4}
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim() || !category}
          className={cn(
            "px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors",
            title.trim() && content.trim() && category
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-surface-hover text-text-tertiary cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
          Post
        </button>
      </div>
    </div>
  );
};

export default PostCreator;