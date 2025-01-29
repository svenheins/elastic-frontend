import express from 'express';
import cors from 'cors';
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

// Enable CORS for the Vue frontend
app.use(cors());
app.use(express.json());

// Create Elasticsearch client
const client = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: process.env.ELASTIC_USERNAME || 'elastic',
    password: process.env.ELASTIC_PASSWORD
  }
});

// Search endpoint
app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    const response = await client.search({
      index: 'test',
      body: {
        query: {
          multi_match: {
            query,
            fields: ["content", "meta.title", "meta.author"]
          }
        }
      }
    });

    res.json(response);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
