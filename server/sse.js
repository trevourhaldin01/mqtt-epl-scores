const clients = new Set();

export function setupSSE(mqttClient) {
    if (!mqttClient) return;

    mqttClient.on('message', (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            const data = JSON.stringify({ topic, ...payload });
            clients.forEach((res) => {
                try {
                    res.write(`data:${data}\n\n`);
                } catch (error) {
                    clients.delete(res)
                }

            })
        } catch (error) {
            console.error('SSE parse error:', e.message);
        }
    })
};

export function addSSEClient(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    clients.add(res);

    res.on('close',()=>{
        clients.delete(res)
    });
}