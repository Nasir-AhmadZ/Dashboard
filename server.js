// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

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

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const alertSchema = new mongoose.Schema({
  username: { type: String, required: true },
  behavior: { type: String, required: true },
  score:    { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});
const Alert = mongoose.model('Alert', alertSchema);

const behaviorLogSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  behavior:  { type: String, required: true },
  score:     { type: Number, required: true },
  timestamp: { type: String },
}, { collection: 'behaviorlogs' });
const BehaviorLog = mongoose.model('BehaviorLog', behaviorLogSchema);

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
const UserData = mongoose.model('UserData', userDataSchema);

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashed });
    res.json({ message: 'Registration successful' });
  } catch (error) {
    res.status(400).json({ detail: error.code === 11000 ? 'Username or email already exists' : error.message });
  }
});

const upload = multer({ dest: 'uploads/' });

app.get('/facial-frames/:username', (req, res) => {
  const dir = path.join(__dirname, '..', 'application_data', 'verification_images', req.params.username);
  if (!fs.existsSync(dir)) return res.json({ frames: [] });
  const frames = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'));
  res.json({ frames });
});

app.delete('/facial-frames/:username', (req, res) => {
  const dir = path.join(__dirname, '..', 'application_data', 'verification_images', req.params.username);
  if (!fs.existsSync(dir)) return res.json({ message: 'Nothing to delete' });
  fs.readdirSync(dir).forEach(f => fs.unlinkSync(path.join(dir, f)));
  res.json({ message: 'Verification images deleted' });
});

app.post('/facial-setup', upload.single('video'), async (req, res) => {
  const { username } = req.body;
  if (!username || !req.file) return res.status(400).json({ detail: 'Username and video required' });

  const outputDir = path.join(__dirname, '..', 'application_data', 'verification_images', username);
  fs.mkdirSync(outputDir, { recursive: true });

  const videoPath = req.file.path;
  // Extract 1 frame per second, max 50 frames
  const args = ['-i', videoPath, '-vf', 'fps=3', '-frames:v', '50',
                path.join(outputDir, 'frame_%03d.jpg')];

  execFile('ffmpeg', args, (err) => {
    fs.unlinkSync(videoPath);
    if (err) return res.status(500).json({ detail: 'Frame extraction failed' });
    const frameCount = fs.readdirSync(outputDir).length;
    res.json({ message: 'Facial setup complete', frames: frameCount });
  });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ detail: 'Invalid username or password' });
    }
    res.json({ message: 'Login successful', username: user.username });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

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

app.post('/api/alerts', async (req, res) => {
  try {
    const { username, behavior, score } = req.body;
    if (!username || !behavior) return res.status(400).json({ detail: 'username and behavior required' });
    const alert = await Alert.create({ username, behavior, score });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

app.get('/api/behavior-log', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ detail: 'username query param required' });
    const entries = await BehaviorLog.find({ username }).sort({ timestamp: 1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/alerts/:username', async (req, res) => {
  try {
    const alerts = await Alert.find({ username: req.params.username })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/alerts/:username', async (req, res) => {
  try {
    await Alert.deleteMany({ username: req.params.username });
    res.json({ message: 'Alerts cleared' });
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