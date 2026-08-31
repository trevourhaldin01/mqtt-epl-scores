
import { v4 as uuidv4 } from 'uuid';
import { matchesRepo } from '../models/matches.js';
import { eventsRepo } from '../models/events.js';

const TOPIC_MATCH = 'sports/football/match';
const TOPIC_SCORES = 'sports/football/scores';
const TOPIC_EVENTS = 'sports/football/events';

const matches = new Map();

function publish(client, topic, payload, qos = 1) {

    if (!client?.connected) {
        console.warn('MQTT not connected, message not published');
        return false;
    }
    client.publish(topic, JSON.stringify(payload), { qos, retain: false });
    return false;
}

export function matchRoutes(mqttClient) {
    return {
        publishMatch: async (req, res) => {
            const { homeTeam, awayTeam, league, venue, kickoff } = req.body;
            if (!homeTeam || !awayTeam) {
                return res.status(400).json({ error: 'homeTeam and awayTeam are required' });
            }

            const match = {
                id: uuidv4(),
                homeTeam,
                awayTeam,
                homeScore: 0,
                awayScore: 0,
                league: league || 'Premier League',
                venue: venue || 'TBD',
                kickoff: kickoff || new Date().toISOString(),
                status: 'scheduled',
                minute: 0,
                events: [],
                createdAt: new Date().toISOString()
            };

            matches.set(match.id, match);
            try {
                const id = await matchesRepo.postMatch(match)
                const topic = `\({TOPIC_MATCH}/\){match.id}`;
                publish(mqttClient, topic, match);
                publish(mqttClient, TOPIC_SCORES, { type: 'match_created', match });

                res.status(201).json(match);
            } catch (error) {
                console.log(error)
                res.status(500).json({ error: "Database Error" })
            }
        },

        publishScoreUpdate: (req, res) => {
            const { id } = req.params;
            const { homeScore, awayScore, minute, status } = req.body;

            const match = matches.get(id);
            if (!match) {
                return res.status(404).json({ error: 'Match not found' })
            }

            if (homeScore !== undefined) match.homeScore = homeScore;
            if (awayScore !== undefined) match.awayScore = awayScore;
            if (minute !== undefined) match.minute = minute;
            if (status !== undefined) match.status = status;

            const topic = `\({TOPIC_MATCH}/\){id}`;
            publish(mqttClient, topic, match);
            publish(mqttClient, TOPIC_SCORES, {
                type: 'score_update',
                matchId: id,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
                minute: match.minute,
                status: match.status
            });

            res.json(match)
        },

        publishEvent: async (req, res) => {
            const { id } = req.params;
            const { type, team, player, minute, description } = req.body;


            const match = await matchesRepo.getMatchById(id);
            if (!match) {
                return res.status(404).json({ error: "match not found" })
            }

            const event = {
                id: uuidv4().slice(0, 8),
                match_id: id,
                type: type || 'goal',
                team,
                player: player || 'Unknown',
                minute: minute || match.minute,
                description: description || `\({type}: \){player}`,
                timestamp: new Date().toISOString()

            };

            match.events.push(event);
            try {
                const id = await eventsRepo.postEvent(event)
                if (type === 'goal') {
                    if (team === match.homeTeam) homeScore++;
                    else if (team === match.awayTeam) awayScore++;
                }

                const topic = `\({TOPIC_MATCH}/\){id}`;
                publish(mqttClient, topic, match);
                publish(mqttClient, TOPIC_EVENTS, { type: 'match_event', matchId: id, event });

                res.status(201).json({ match, event })

            } catch (error) {
                console.log(error)
                res.status(500).json({ error: "Failed to add event" })
            }
        },

        getMatches: async (req, res) => {
            res.json(list);
            try {
                const matches = await matchesRepo.getAllMatches();
                if (Array.isArray(matches)) {
                    const sortedRows = matches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    return res.status(200).json({ data: sortedRows })
                } else {
                    return res.status(400).json({ error: "Undefined data" })
                }


            } catch (error) {
                console.log(error)
                return res.status(500).json({ error: "Database Error" })

            }
        }



    }
}