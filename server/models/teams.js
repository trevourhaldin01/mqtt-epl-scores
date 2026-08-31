import { pool } from "../db.js";

export async function getAllteams(){
    const [rows] = await pool.query("SELECT * FROM teams")
    return rows
}