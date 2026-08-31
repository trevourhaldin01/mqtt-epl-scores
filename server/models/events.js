import { pool } from "../db.js";

async function getEventsByMatchId(matchId){
    const [rows] = await pool.query(
        "SELECT * FROM events WHERE match_id = ?",matchId
    );
    return rows

}

async function postEvent(event) {
    const result =await pool.query(
        `INSERT INTO events 
        (id, match_id,type,team,player,minute,description)
        VALUES(?,?,?,?,?,?,?)`,
        [event.id, event.match_id, event.type, event.team, event.player,event.minute, event.description
        ]
    )
    return result.insertId;
}

export const eventsRepo = {
    getEventsByMatchId,
    postEvent,
}

