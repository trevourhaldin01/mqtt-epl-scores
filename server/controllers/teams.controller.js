import { getAllteams } from "../models/teams.js"

const fetchAllTeams = async(req,res)=>{
    try {
        const teams = await getAllteams()
        res.status(200).json({data: teams})
        
    } catch (error) {
        console.log(error)
        res.status(400).json({error:"Failed to fetch teams"})
    }
}

export const teamsController = {
    fetchAllTeams,
}