import Reaction from '../models/reactionModel.js';

const reactionController = {
  async createType(req, res) {
    try {
      if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

      const { name } = req.body;
      const creatorId = req.session.user.id;

      if (!req.file) return res.status(400).json({ error: 'Image is required' });
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const imageUrl = `/uploads/${req.file.filename}`;
      await Reaction.createType(name, imageUrl, creatorId);

      res.status(201).json({ message: 'Reaction type created' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getTypes(req, res) {
    try {
      const types = await Reaction.getAllTypes();
      res.json(types);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default reactionController;
