import express from "express";
import cors from "cors";
import ytSearch from "yt-search";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});