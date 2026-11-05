const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/clip', async (req, res) => {
    const { videoUrl, startTime, duration } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'Missing video URL' });

    const outputFileName = `clip_${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, outputFileName);

    const args = [
        videoUrl,
        '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b',
        '--downloader', 'ffmpeg',
        '--downloader-args', `ffmpeg_i:-ss ${startTime} -to ${startTime + duration}`,
        '-o', outputPath
    ];

    const child = spawn('yt-dlp', args);

    child.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
            res.download(outputPath, outputFileName, () => {
                setTimeout(() => fs.unlinkSync(outputPath), 10000);
            });
        } else {
            res.status(500).json({ error: 'Failed to process clip' });
        }
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
