import pool from '../database/connect.js';

const Reaction = {
  async createType(name, imageUrl, creatorId) {
    const query = 'INSERT INTO reaction_types (name, image_url, creator_id) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [name, imageUrl, creatorId]);
    return result.insertId;
  },

  async getAllTypes() {
    const query = 'SELECT * FROM reaction_types ORDER BY created_at DESC';
    const [rows] = await pool.query(query);
    return rows;
  },

  async toggle(postId, userId, typeId) {
    const connection = await pool.getConnection();
    try {
      const checkQuery = 'SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND reaction_type_id = ?';
      const [rows] = await connection.query(checkQuery, [postId, userId, typeId]);

      if (rows.length > 0) {
        await connection.query('DELETE FROM reactions WHERE id = ?', [rows[0].id]);
        return 'removed';
      } else {
        await connection.query('INSERT INTO reactions (post_id, user_id, reaction_type_id) VALUES (?, ?, ?)', [postId, userId, typeId]);
        return 'added';
      }
    } finally {
      connection.release();
    }
  },

  async getReactionsByPostId(postId) {
    const query = `
      SELECT 
        rt.id, 
        rt.name, 
        rt.image_url, 
        COUNT(r.id) as count,
        GROUP_CONCAT(r.user_id) as user_ids
      FROM reaction_types rt
      JOIN reactions r ON r.reaction_type_id = rt.id
      WHERE r.post_id = ?
      GROUP BY rt.id, rt.name, rt.image_url
    `;
    const [rows] = await pool.query(query, [postId]);

    return rows.map((row) => ({
      ...row,
      user_ids: row.user_ids ? row.user_ids.split(',').map(Number) : [],
    }));
  },

  async getAllReactionsGrouped() {
    const query = `
      SELECT 
        r.post_id, 
        rt.id as type_id, 
        rt.name, 
        rt.image_url, 
        COUNT(r.id) as count,
        GROUP_CONCAT(r.user_id) as user_ids
      FROM reactions r
      JOIN reaction_types rt ON r.reaction_type_id = rt.id
      GROUP BY r.post_id, rt.id
      `;
    const [rows] = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      user_ids: row.user_ids ? row.user_ids.split(',').map(Number) : [],
    }));
  },
};

export default Reaction;
