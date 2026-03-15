const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = 'mongodb+srv://NasirAhmad:Sagheer123@tta-login-cluster.3ocooiw.mongodb.net/car-dashboard?retryWrites=true&w=majority&appName=TTA-Login-Cluster';

const leaderboardSchema = new mongoose.Schema({
  name: String,
  score: Number,
  rank: Number,
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

async function syncScore() {
  try {
    const data = JSON.parse(fs.readFileSync('/home/nasir/dashboard/TTA-Frontend/behavior_log.json', 'utf8'));
    const totalScore = data.reduce((sum, entry) => sum + entry.score, 0);
    
    await mongoose.connect(MONGODB_URI);
    
    await Leaderboard.findOneAndUpdate(
      { name: 'Nasir' },
      { name: 'Nasir', score: totalScore },
      { upsert: true, new: true }
    );
    
    const allPlayers = await Leaderboard.find().sort({ score: -1 });
    allPlayers.forEach((player, index) => {
      player.rank = index + 1;
    });
    await Promise.all(allPlayers.map(p => p.save()));
    
    console.log(`✓ Synced score: ${totalScore} at ${new Date().toLocaleString()}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Sync error:', error.message);
  }
}

syncScore();
setInterval(syncScore, 10 * 60 * 1000);
