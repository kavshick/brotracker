require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 4000;
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Set it in backend/.env before starting the server.');
}

app.listen(PORT, () => console.log(`BroTracker backend running on http://localhost:${PORT}`));
