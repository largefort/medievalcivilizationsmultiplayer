const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());

const users = [];
const servers = [];
const secret = 'your_jwt_secret';

app.post('/register', (req, res) => {
  const { email, username } = req.body;
  const password = Math.random().toString(36).slice(-8); // Generate random password
  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ email, username, password: hashedPassword });
  res.status(200).json({ password });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });
    res.status(200).json({ token });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

app.get('/servers', (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  try {
    jwt.verify(token, secret);
    res.status(200).json(servers);
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

app.post('/create-server', (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  try {
    jwt.verify(token, secret);
    const server = { id: servers.length + 1, name: `Server ${servers.length + 1}` };
    servers.push(server);
    res.status(200).json(server);
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

io.on('connection', (socket) => {
  socket.on('joinServer', (serverId) => {
    console.log(`User joined server ${serverId}`);
    socket.join(`server_${serverId}`);
    io.to(`server_${serverId}`).emit('message', `User has joined server ${serverId}`);
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
