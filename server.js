// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb+srv://NasirAhmad:Sagheer123@tta-login-cluster.3ocooiw.mongodb.net/car-dashboard?retryWrites=true&w=majority&appName=TTA-Login-Cluster';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

const leaderboardSchema = new mongoose.Schema({
  name: String,
  score: Number,
  rank: Number,
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

app.get('/api/leaderboard', async (req, res) => {
  try {
    const data = await Leaderboard.find().sort({ score: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/leaderboard/seed', async (req, res) => {
  try {
    await Leaderboard.deleteMany({});
    const names = [
      'Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Wilson',
      'James Brown', 'Olivia Davis', 'Noah Martinez', 'Ava Garcia',
      'Liam Anderson', 'Sophia Taylor', 'Mason Thomas', 'Isabella Moore',
      'Ethan Jackson', 'Mia White', 'Lucas Harris', 'Charlotte Martin',
      'Benjamin Lee', 'Amelia Thompson', 'Henry Walker', 'Evelyn Hall'
    ];
    
    const sampleData = names.map((name, index) => ({
      name,
      score: Math.floor(Math.random() * 1001),
      rank: index + 1,
    }));
    
    sampleData.sort((a, b) => b.score - a.score);
    sampleData.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    await Leaderboard.insertMany(sampleData);
    res.json({ message: 'Database seeded successfully', count: sampleData.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Leaderboard API: http://localhost:${PORT}/api/leaderboard`);
  console.log(`Seed endpoint: http://localhost:${PORT}/api/leaderboard/seed`);
});