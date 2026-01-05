import Reaction from '../../models/reactionModel.js';

export const toggleReaction = (io, socket) => async (data) => {
  const sessionUser = socket.request.session.user;
  if (!sessionUser) return;

  const { postId, typeId } = data;

  try {
    await Reaction.toggle(postId, sessionUser.id, typeId);
    const updatedReactions = await Reaction.getReactionsByPostId(postId);

    io.emit('update_reactions', { postId, reactions: updatedReactions });
  } catch (err) {
    console.error(err);
  }
};
