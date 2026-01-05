import Post from '../models/postModel.js';

const postController = {
  async create(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { content } = req.body;
      const userId = req.session.user.id;

      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Content is required' });
      }

      await Post.create(userId, content);

      res.status(201).json({ message: 'Post created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default postController;
