import pool from '../database/connect.js';

const Post = {
  async create(userId, content, imageUrl = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('DELETE FROM posts WHERE user_id = ?', [userId]);

      const query = 'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)';
      const [result] = await connection.query(query, [userId, content, imageUrl]);

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async findByIdWithUser(postId) {
    const query = `
      SELECT p.*, u.username, u.profile_image_url 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `;
    const [rows] = await pool.query(query, [postId]);
    return rows[0];
  },

  async findAll() {
    const query = `
      SELECT p.*, u.username, u.profile_image_url 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  },
};

export default Post;
