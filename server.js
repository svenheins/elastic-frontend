import express from 'express';
import cors from 'cors';
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

// read .env
dotenv.config();

// Load environment variables
if (process.env.DOCKER_ENVIRONMENT === 'true') {
  console.info('Using elasticsearch node');
  // set node to http://elasticsearch:9200
  process.env.ELASTIC_NODE = 'http://elasticsearch:9200';

} else {
  console.info('Using localhost node');
  // set node to http://localhost:9200
  process.env.ELASTIC_NODE = 'http://localhost:9200';  
}

const app = express();
const port = 3000;

// Enable CORS for the Vue frontend
app.use(cors());
app.use(express.json());

// Create Elasticsearch client
const client = new Client({
  node: process.env.ELASTIC_NODE,
  auth: {
    username: process.env.ELASTIC_USERNAME || 'elastic',
    password: process.env.ELASTIC_PASSWORD
  }
});

// Search endpoint
app.post('/search', async (req, res) => {
  try {
    const { query, page = 1, size = 25, filters = {} } = req.body;
    
    // Build query based on search and filters
    const must = [
      {
        multi_match: {
          query,
          fields: ["content", "meta.title", "meta.author", "attributes.owner", "attributes.group"]
        }
      }
    ];

    // Add filter conditions
    if (filters.title) {
      must.push({ match_phrase_prefix: { "meta.title": filters.title } });
    }
    if (filters.author) {
      must.push({ match_phrase_prefix: { "meta.author": filters.author } });
    }
    if (filters.language) {
      must.push({ match_phrase_prefix: { "meta.language": filters.language } });
    }
    if (filters.owner) {
      must.push({ match_phrase_prefix: { "attributes.owner": filters.owner } });
    }
    if (filters.group) {
      must.push({ match_phrase_prefix: { "attributes.group": filters.group } });
    }

    const response = await client.search({
      index: 'test',
      body: {
        query: {
          bool: {
            must: must
          }
        },
        from: (page - 1) * size,
        size: size,
        track_total_hits: true
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
