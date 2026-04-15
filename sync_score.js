
require('dotenv').config();
 
const mongoose = require('mongoose');
const fs = require('fs');
 
const MONGODB_URI = process.env.MONGODB_URI;
const LOG_PATH = process.env.BEHAVIOR_LOG_PATH || '/home/nasir/StartupServer/behavior_log.json';
 
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set. Check your .env file.');
  process.exit(1);
}
 
const leaderboardSchema = new mongoose.Schema({
  name: String,
  score: Number,
  rank: Number,
});

const behaviorLogSchema = new mongoose.Schema({
  username: String,
  behavior: String,
  score: Number,
  timestamp: String,
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
const BehaviorLog = mongoose.model('BehaviorLog', behaviorLogSchema);
 
async function syncScore() {
  try {
    let data;
    try {
      const raw = await fs.promises.readFile(LOG_PATH, 'utf8');
      data = JSON.parse(raw);
    } catch (fileErr) {
      console.error('Failed to read or parse behavior log:', fileErr);
      return;
    }
 
    // Group scores by username, skip entries without one
    const scoresByUser = {};
    for (const entry of data) {
      if (!entry.username) continue;
      scoresByUser[entry.username] = (scoresByUser[entry.username] || 0) + entry.score;
    }
 
    if (Object.keys(scoresByUser).length === 0) {
      console.log('No user entries found in behavior log.');
      return;
    }
 
    // Insert new behavior log entries (skip duplicates by username+timestamp)
    const userEntries = data.filter(e => e.username);
    for (const entry of userEntries) {
      await BehaviorLog.findOneAndUpdate(
        { username: entry.username, timestamp: entry.timestamp },
        entry,
        { upsert: true }
      );
    }

    // Upsert each user's score
    for (const [username, totalScore] of Object.entries(scoresByUser)) {
      await Leaderboard.findOneAndUpdate(
        { name: username },
        { name: username, score: totalScore },
        { upsert: true, returnDocument: 'after' }
      );
    }
 
    // Recalculate ranks for all players using bulkWrite
    const allPlayers = await Leaderboard.find().sort({ score: -1 });
    const bulkOps = allPlayers.map((player, index) => ({
      updateOne: {
        filter: { _id: player._id },
        update: { $set: { rank: index + 1 } },
      },
    }));
    if (bulkOps.length > 0) {
      await Leaderboard.bulkWrite(bulkOps);
    }
 
    const summary = Object.entries(scoresByUser).map(([u, s]) => `${u}:${s}`).join(', ');
    console.log(`? Synced scores at ${new Date().toLocaleString()} ? ${summary}`);
  } catch (error) {
    console.error('Sync error:', error);
  }
}
 
async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');
 
    await syncScore();
    setInterval(syncScore, 10 * 60 * 1000);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}
 
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});
 
process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});
 
main();