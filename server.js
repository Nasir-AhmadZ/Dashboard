// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.0.34:3000'],
  credentials: true
}));
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

const userDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  dailyData: [{
    date: { type: Date, default: Date.now },
    value: { type: Number, default: 0 }
  }]
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
const UserData = mongoose.model('UserData', userDataSchema);

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

app.get('/api/userdatas/:userId', async (req, res) => {
  try {
    const user = await UserData.findOne({ userId: req.params.userId });
    res.json(user || { dailyData: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/userdatas/update', async (req, res) => {
  try {
    const { userId, name, change } = req.body;
    let user = await UserData.findOne({ userId });
    
    if (!user) {
      user = new UserData({ userId, name, dailyData: [{ value: 0 }] });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastEntry = user.dailyData[user.dailyData.length - 1];
    const lastDate = new Date(lastEntry.date);
    lastDate.setHours(0, 0, 0, 0);
    
    if (lastDate.getTime() === today.getTime()) {
      lastEntry.value += change;
    } else {
      user.dailyData.push({ date: today, value: lastEntry.value + change });
    }
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/userdatas/seed', async (req, res) => {
  try {
    await UserData.deleteMany({});
    const dailyData = [];
    let value = 0;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const change = Math.floor(Math.random() * 41) - 20;
      value += change;
      dailyData.push({ date, value });
    }
    
    await UserData.create({ userId: 'user1', name: 'Personal User', dailyData });
    res.json({ message: 'User data seeded with 30 days', count: dailyData.length });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Leaderboard API: http://localhost:${PORT}/api/leaderboard`);
  console.log(`Seed endpoint: http://localhost:${PORT}/api/leaderboard/seed`);
});