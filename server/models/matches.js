import { pool } from "../db.js";

export async function getAllMatches(){
    const [rows] = await pool.query(
        "SELECT * FROM matches"
    );
    console.log("results",rows)

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
    const result =await pool.query(
        `INSERT INTO matches 
        (id, home_team,away_team,home_score,away_score,league,venue,kickoff,status,minute)
        VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [body.id,body.homeTeam, body.awayTeam,body.homeScore,body.awayScore,body.league,
         body.venue,  body.status, body.minute 
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
    "UPDATE matches SET score = ? WHERE id = ?",
    [score, id]
  );

  return result.affectedRows;
}

export const matchesRepo ={
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
