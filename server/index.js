import express from 'express';
import cors from 'cors';
import mqtt from 'mqtt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid'
import { matchRoutes } from './routes/matches.js';
import { addSSEClient, setupSSE } from './sse.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

let mqttClient = null;

function connectMQTT() {
    mqttClient = mqtt.connect(MQTT_BROKER, {
        clientId: `football-scores-${uuidv4().slice(0, 8)}`,
        reconnectPeriod: 3000,
        connectTimeout: 10000
    });

    mqttClient.on('connect', () => {
        console.log(`Conected to mqtt broker at`, MQTT_BROKER);
        mqttClient.subscribe('sports/football/#', { qos: 1 }, (err) => {
            if (err) console.error('Subscribe error:', err)
        });
    });

    mqttClient.on('error', (err) => {
        console.log('MQTT error', err.message);
    });

    mqttClient.on('close', () => {
        console.log('MQTT connection closed');
    });

    mqttClient.on('reconnect', () => {
        console.log('MQTT reconnecting...')
    });

    return mqttClient;
}

const mqttClientInstance = connectMQTT();
const {publishMatch,publishEvent,publishScoreUpdate,getMatches} = matchRoutes(mqttClientInstance);
setupSSE(mqttClientInstance);

app.get('/api/events',(req,res)=> addSSEClient(res));
app.post('/api/matches',publishMatch);
app.patch('/api/matches/:id/score', publishScoreUpdate);
app.post('/api/matches/:id/events', publishEvent);
app.get('/api/matches', getMatches);

app.listen(PORT, () => {
    console.log(`Football Scores Server running at http://localhost:${PORT}`);
    console.log(`Admin (upload):  http://localhost:${PORT}/admin.html`);
    console.log(`Viewer:          http://localhost:${PORT}/viewer.html`);
})


