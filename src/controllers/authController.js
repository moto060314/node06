import bcrypt from 'bcrypt';
import User from '../models/userModel.js';

const authController = {
  async signup(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const profileImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const userId = await User.create(username, email, passwordHash, profileImageUrl);
      const user = await User.findById(userId);

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        profileImageUrl: user.profile_image_url,
      };

      res.status(201).json({ message: 'User created successfully', user: req.session.user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async signin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        profileImageUrl: user.profile_image_url,
      };

      res.status(200).json({ message: 'Logged in successfully', user: req.session.user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  signout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  },

  async updateProfile(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      const { username, email, password } = req.body;

      if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
      }

      let passwordHash = null;
      if (password) {
        const saltRounds = 10;
        passwordHash = await bcrypt.hash(password, saltRounds);
      }

      const profileImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      await User.update(userId, username, email, passwordHash, profileImageUrl);

      const updatedUser = await User.findById(userId);

      req.session.user = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImageUrl: updatedUser.profile_image_url,
      };

      res.status(200).json({ message: 'Profile updated successfully', user: req.session.user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default authController;
