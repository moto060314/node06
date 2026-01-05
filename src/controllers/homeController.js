import Post from '../models/postModel.js';
import Reaction from '../models/reactionModel.js';

const index = async (req, res) => {
  try {
    const posts = await Post.findAll();
    const reactions = await Reaction.getAllReactionsGrouped();

    const postsWithReactions = posts.map((post) => {
      const postReactions = reactions.filter((r) => r.post_id === post.id);
      return { ...post, reactions: postReactions };
    });

    return res.render('home/index', { posts: postsWithReactions });
  } catch (error) {
    console.error(error);
    return res.render('home/index', { posts: [] });
  }
};

export default {
  index,
};
