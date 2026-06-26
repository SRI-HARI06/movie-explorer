const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/awards', require('./routes/awards'));
app.use('/api/chatbot', require('./routes/chatbot'));
const recommendationsRoute = require('./routes/recommendations');
app.use('/api/recommendations', recommendationsRoute);
const collaborativeRoute = require('./routes/collaborative');
app.use('/api/collaborative', collaborativeRoute);

const knnRoute = require('./routes/knn');
app.use('/api/knn', knnRoute);

const connectionsRoute = require('./routes/connections');
app.use('/api/connections', connectionsRoute);

app.get('/', (req, res) => {
    res.json({ message: 'Movie Explorer API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});