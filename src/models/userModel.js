import pool from '../database/connect.js';

const User = {
  async create(username, email, passwordHash, profileImageUrl = null) {
    const query = `
      INSERT INTO users (username, email, password_hash, profile_image_url)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [username, email, passwordHash, profileImageUrl]);
    return result.insertId;
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.query(query, [email]);
    return rows[0];
  },

  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  async update(id, username, email, passwordHash, profileImageUrl) {
    let query = 'UPDATE users SET username = ?, email = ?';
    const params = [username, email];

    if (passwordHash) {
      query += ', password_hash = ?';
      params.push(passwordHash);
    }

    if (profileImageUrl) {
      query += ', profile_image_url = ?';
      params.push(profileImageUrl);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);
  },
};

export default User;
