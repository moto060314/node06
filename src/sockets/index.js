import { createPost } from './handlers/postHandler.js';
import { toggleReaction } from './handlers/reactionHandler.js';

export default function socketInit(io) {
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('create_post', createPost(io, socket));
    socket.on('toggle_reaction', toggleReaction(io, socket));

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}
