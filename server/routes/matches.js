
import { v4 as uuidv4 } from 'uuid';

const TOPIC_MATCH = 'sports/football/match';
const TOPIC_SCORES = 'sports/football/scores';
const TOPIC_EVENTS = 'sports/football/events';

const matches = new Map();

function publish(client,topic, payload, qos =1){

    if(!client?.connected){
        console.warn('MQTT not connected, message not published');
        return false;
    }
    client.publish(topic, JSON.stringify(payload), { qos, retain: false });
    return false;    
}

export function matchRoutes(mqttClient){
    return {
        publishMatch: (req, res) => {
            const {homeTeam, awayTeam,league, venue, kickoff} = req.body;
            if(!homeTeam || !awayTeam) {
                return res.status(400).json({error:'homeTeam and awayTeam are required'});
            }

            const match = {
                id: uuidv4(),
                homeTeam,
                awayTeam,
                homeScore: 0,
                awayScore: 0,
                league: league || 'Premier League',
                venue: venue || 'TBD',
                kickoff: kickoff || new  Date().toISOString(),
                status: 'scheduled',
                minute: 0,
                events: [],
                createdAt: new Date().toISOString()
            };

            matches.set(match.id , match);

            const topic = `\({TOPIC_MATCH}/\){match.id}`;
            publish(mqttClient,topic,match);
            publish(mqttClient,TOPIC_SCORES,{type: 'match_created',match});
            
            res.status(201).json(match);
        },

        publishScoreUpdate: (req, res) => {
            const {id} = req.params;
            const {homeScore, awayScore, minute, status} = req.body;

            const match = matches.get(id);
            if(!match){
                return res.status(404).json({error:'Match not found'})
            }

            if(homeScore !== undefined) match.homeScore = homeScore;
            if(awayScore !== undefined) match.awayScore = awayScore;
            if(minute !== undefined) match.minute = minute;
            if(status !== undefined) match.status = status;

            const topic = `\({TOPIC_MATCH}/\){id}`;
            publish(mqttClient, topic, match);
            publish(mqttClient, TOPIC_SCORES,{
                type:'score_update',
                matchId: id,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
                minute: match.minute,
                status: match.status
            });

            res.json(match)
        },

        publishEvent: (req, res) => {
            const {id}  = req.params;
            const {type, team, player, minute, description} = req.body;


            const match = matches.get(id);
            if(!match) {
                return res.status(404).json({error:"match not found"})
            }

            const event = {
                id: uuidv4().slice(0,8),
                type: type || 'goal',
                team,
                player: player || 'Unknown',
                minute: minute || match.minute,
                description: description || `\({type}: \){player}`,
                timestamp: new Date().toISOString()

            };

            match.events.push(event);
            if(type === 'goal'){
                if(team === match.homeTeam) homeScore++;
                else if(team === match.awayTeam) awayScore++;
            }

            const topic = `\({TOPIC_MATCH}/\){id}`;
            publish(mqttClient,topic,match);
            publish(mqttClient, TOPIC_EVENTS, {type:'match_event',matchId: id, event});

            res.status(201).json({match, event})

        },

        getMatches: (req,res) =>{
            const list = Array.from(matches.values()).sort(
                (a,b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            res.json(list);
        }



    }
}