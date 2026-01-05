import Post from '../../models/postModel.js';

export const createPost = (io, socket) => async (data) => {
  const sessionUser = socket.request.session.user;

  if (!sessionUser) {
    socket.emit('error_message', 'Unauthorized');
    return;
  }

  const { content } = data;
  if (!content || content.trim() === '') {
    socket.emit('error_message', 'Content is required');
    return;
  }

  try {
    const newPostId = await Post.create(sessionUser.id, content);
    const fullPost = await Post.findByIdWithUser(newPostId);

    io.emit('new_post', fullPost);

    socket.emit('post_success');
  } catch (err) {
    console.error(err);
    socket.emit('error_message', 'Internal Server Error');
  }
};
