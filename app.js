import express from "express";
import cors from "cors";
import ytSearch from "yt-search";
import path from "path";
import { fileURLToPath } from "url";
import {exec,spawn} from 'child_process';
import ytdl from 'ytdl-core'
import fs from 'fs';
import { youtubeDl } from 'youtube-dl-exec';

const app = express();
const PORT = 3000;
let globalProgress = 0;
let progressInterval;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));
app.get("/search", async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: "No search query provided" });
    }

    try {
        const results = await ytSearch(query);
        if (results.videos.length > 0) {
            return res.json({ videoId: results.videos[0].videoId, url: results.videos[0].url });
        } else {
            return res.status(404).json({ error: "No videos found" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/download", async (req, res) => {
    try {
        const url = req.body.url;
        globalProgress = 0;

        if (!url) return res.status(400).json({ error: "No URL provided" });

        const outputFileName = `video_${Date.now()}.mp4`;
        const outputPath = path.join(__dirname, "downloads", outputFileName);
        progressInterval = setInterval(() => {
            if (globalProgress < 95) globalProgress += 5;
        }, 2000);

        const ytDlp = spawn("yt-dlp", [
            url,
            "-f b",
            "-o", outputPath,
            "--progress-template", "%(percent)s"
        ]);

        ytDlp.stdout.on("data", (data) => {
            const progressMatch = data.toString().trim().match(/(\d+(\.\d+)?)%/);
            if (progressMatch) {
                globalProgress = parseFloat(progressMatch[1]);
                console.log(`Progress: ${globalProgress}%`);
            }
        });

        ytDlp.stderr.on("data", (data) => console.error("Error:", data.toString()));

        ytDlp.on("close", (code) => {
            clearInterval(progressInterval); 
            globalProgress = 100; 
            console.log(`Download complete!`);
            res.json({ path: `/downloads/${outputFileName}` });
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.use("/downloads", express.static(path.join(__dirname, "downloads")));

        /*const ffmpegPath = "D:/ffmpeg/bin/ffmpeg.exe";
        const ffmpegArgs = ["-i", "-", "-c:v", "copy", "-c:a", "copy", "-f", "mp4", "-y", downloadPath];

        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);

        const videoBuffer = await ytdl(url, { quality: "lowest" });

        ffmpegProcess.stdin.write(videoBuffer);
        ffmpegProcess.stdin.end(); // End the input stream

        ffmpegProcess.on("close", (code) => {
            console.log("Download complete!");
            res.json({ message: "Download complete!", path: downloadPath });
        });*/


        app.get("/progress", (req, res) => {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
        
            const sendProgress = () => {
                res.write(`data: ${globalProgress}\n\n`);
                if (globalProgress >= 100) {
                    res.write("data: complete\n\n");
                    res.end();
                    clearInterval(interval);
                }
            };
        
            const interval = setInterval(sendProgress, 500);
            sendProgress();
        
            req.on("close", () => clearInterval(interval));
        });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});