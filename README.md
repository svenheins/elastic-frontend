# Elasticsearch Document Search Interface

A modern, responsive web application built with Vue 3 and Vite that provides a powerful interface for searching and viewing documents indexed in Elasticsearch. The application features a clean, user-friendly interface with advanced sorting, filtering, and document preview capabilities.

## Features

### Search Interface
- **Advanced Filtering**: Filter results by title, author, and language
- **Smart Sorting**: Click on any column header to sort results
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Document Management
- **Document Preview**: View document details in a modal window
- **Metadata Display**: See comprehensive metadata including:
  - Title
  - Author
  - Date
  - Language
  - File information
  - Content preview
- **Search Relevance**: Visual representation of search result relevance scores

### User Experience
- **Loading States**: Clear loading indicators during searches
- **Error Handling**: Friendly error messages when things go wrong
- **Keyboard Navigation**: Support for keyboard shortcuts

## Technology Stack

### Frontend
- Vue 3 with Composition API
- Vite for build tooling
- Tailwind CSS for styling
- ES Modules for modern JavaScript

### Backend
- Express.js server
- Elasticsearch server with CORS support for cross-origin requests

## Prerequisites

Before you begin, ensure you have:
- Node.js (v16 or higher)
- npm (v7 or higher)
- Elasticsearch (v8.x) running locally or accessible, i.e. use https://github.com/svenheins/elastic-crawler for a docker compose setup with ElasticSearch, Kibana and fscrawler (https://github.com/dadoonet/fscrawler). 

### Elasticsearch Configuration

Ensure your Elasticsearch instance has CORS enabled if you are working in a local development environment. Add these settings to your `elasticsearch.yml`:

```yaml
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-credentials: true
http.cors.allow-methods: OPTIONS, HEAD, GET, POST, PUT, DELETE
http.cors.allow-headers: X-Requested-With, X-Auth-Token, Content-Type, Content-Length, Authorization, Access-Control-Allow-Headers, Accept, x-elastic-client-meta
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/svenheins/elastic-frontend.git
   cd elastic-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Elasticsearch credentials:
   ```
   ELASTIC_USERNAME=your_username
   ELASTIC_PASSWORD=your_password
   ```

## Running the Application

1. **Start the backend server**
   ```bash
   npm run server
   ```
   The server will start on http://localhost:3000

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:5173

## Project Structure

```
elastic-frontend/
├── src/                    # Source files
│   ├── assets/            # Static assets and styles
│   │   └── styles.css     # Global styles
│   ├── components/        # Vue components
│   │   └── DocumentDetailsModal.vue
│   └── App.vue            # Main application component
├── server.js              # Express backend server
├── .env                   # Environment variables (git-ignored)
├── .env.example          # Example environment variables
└── package.json          # Project dependencies and scripts
```

## API Endpoints

### POST /search
Search for documents in Elasticsearch

**Request Body:**
```json
{
  "query": "search term"
}
```

**Response:**
```json
{
  "hits": {
    "hits": [
      {
        "_id": "document_id",
        "_score": 1.0,
        "_source": {
          "meta": {
            "title": "Document Title",
            "author": "Author Name",
            "date": "2025-01-29",
            "language": "en"
          },
          "file": {
            "filename": "document.pdf",
            "filesize": 1024
          },
          "content": "Document content..."
        }
      }
    ]
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Vue.js](https://vuejs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Search powered by [Elasticsearch](https://www.elastic.co/)