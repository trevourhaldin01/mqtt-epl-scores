import { pool } from "../db.js";

export async function getAllMatches() {
  const [rows] = await pool.query(
    `SELECT
      m.*,

      h.team_name AS home_team_name,


      a.team_name AS away_team_name


      FROM matches m 
      JOIN teams h ON m.home_team_id = h.id 
      JOIN teams a ON m.away_team_id = a.id
    `);
  console.log("results", rows)

  return rows

}

export async function getMatchById(id) {
  const [rows] = await pool.query(
    "SELECT * FROM matches WHERE id = ?",
    [id]
  );

  return rows[0];
}


export async function postMatch(body) {
  const result = await pool.query(
    `INSERT INTO matches 
        (id, home_team_id,away_team_id,home_score,away_score,venue,kickoff,status,minute)
        VALUES(?,?,?,?,?,?,?,?,?)`,
    [body.id, body.homeTeamId, body.awayTeamId, body.homeScore, body.awayScore,
    body.venue, body.kickoff, body.status, body.minute
    ]
  )
  return result.insertId;
}

export async function deleteMatch(id) {
  const [result] = await pool.query(
    "DELETE FROM matches WHERE id = ?",
    [id]
  );

  return result.affectedRows;
}

export async function updateMatch(id, score) {
  const [result] = await pool.query(
    `UPDATE matches
   SET
     home_score = ?,
     away_score = ?,
     minute = ?,
     status = ?
   WHERE id = ?`,
    [
      score.home_score,
      score.away_score,
      score.minute,
      score.status,
      id
    ]
  );


  return result.affectedRows;
}

export const matchesRepo = {
  getAllMatches,
  getMatchById,
  postMatch,
  updateMatch,
  deleteMatch
}





//transactions
// const client = await pool.connect();

// try {
//     await client.query("BEGIN");

//     await client.query(...);
//     await client.query(...);

//     await client.query("COMMIT");
// } catch (err) {
//     await client.query("ROLLBACK");
//     throw err;
// } finally {
//     client.release();
// }
