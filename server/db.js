import mysql from "mysql2/promise";

export const pool = mysql.createPool({
    host: "localhost",
    user:'root',
    password:'#10Atomsatme',
    database:'mqtt_epl_scores'
});


//use dbmate for migrations