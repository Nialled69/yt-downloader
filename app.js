import express from 'express';

import ytdl from 'ytdl-core';

import { spawn } from 'child_process';

const app = express();

app.listen(3000,()=>{
    console.log("Server is running successfully");
})