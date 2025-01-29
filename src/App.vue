<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Elasticsearch Document Search</h1>
    
    <!-- Search Form -->
    <div class="flex gap-2 mb-6">
      <input 
        v-model="searchQuery" 
        @keyup.enter="performSearch"
        type="text" 
        placeholder="Enter your search query..." 
        class="flex-1 p-2 border rounded"
      >
      <button 
        @click="performSearch" 
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Searching...' : 'Search' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
      {{ error }}
    </div>

    <!-- Results -->
    <div v-if="results.length > 0" class="space-y-6">
      <div class="flex gap-6">
        <!-- Table Section -->
        <div class="flex-1">
          <table class="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th 
                  v-for="header in tableHeaders" 
                  :key="header.key"
                  @click="sortBy(header.key)"
                  class="sortable"
                  :data-sorted="sortKey === header.key ? sortOrder : null"
                >
                  {{ header.label }}
                </th>
              </tr>
              <tr>
                <th v-for="header in tableHeaders" :key="header.key">
                  <input 
                    v-if="header.key === 'title'" 
                    v-model="filters.title" 
                    type="text" 
                    placeholder="Filter by title" 
                  >
                  <input 
                    v-if="header.key === 'author'" 
                    v-model="filters.author" 
                    type="text" 
                    placeholder="Filter by author" 
                  >
                  <input 
                    v-if="header.key === 'language'" 
                    v-model="filters.language" 
                    type="text" 
                    placeholder="Filter by language" 
                  >
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="result in sortedAndFilteredResults" 
                :key="result._id" 
                @click="selectedResult = result"
                :class="{'bg-blue-50': selectedResult?._id === result._id}"
                class="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td>
                  <div class="tooltip-container">
                    {{ result._source?.meta?.title || '' }}
                    <div class="tooltip">{{ result._source?.meta?.title || 'No title available' }}</div>
                  </div>
                </td>
                <td>
                  <div class="tooltip-container">
                    {{ result._source?.meta?.author || '' }}
                    <div class="tooltip">{{ result._source?.meta?.author || 'No author available' }}</div>
                  </div>
                </td>
                <td>
                  <div class="tooltip-container">
                    {{ formatDate(result._source?.meta?.date || 0) }}
                    <div class="tooltip">{{ formatDate(result._source?.meta?.date || 0) }}</div>
                  </div>
                </td>
                <td>
                  <div class="tooltip-container">
                    {{ result._source?.meta?.language || '' }}
                    <div class="tooltip">{{ result._source?.meta?.language || 'No language specified' }}</div>
                  </div>
                </td>
                <td>
                  <div class="tooltip-container">
                    {{ result._source?.file?.filename || '' }}
                    <div class="tooltip">{{ result._source?.file?.filename || 'No filename available' }}</div>
                  </div>
                </td>
                <td>
                  <div class="tooltip-container">
                    {{ formatFileSize(result._source?.file?.filesize || 0) }}
                    <div class="tooltip">Size: {{ formatFileSize(result._source?.file?.filesize || 0) }}</div>
                  </div>
                </td>
                <td>
                  <div class="tooltip-container">
                    {{ (result._score || 0).toFixed(2) }}
                    <div class="tooltip">Relevance Score: {{ result._score || 0 }}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Details Panel -->
        <div v-if="selectedResult" class="w-96 bg-white border border-gray-200 shadow-sm rounded-lg p-6 h-fit sticky top-6">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Document Details</h3>
            <button 
              @click="selectedResult = null"
              class="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div class="space-y-4">
            <!-- Meta Information -->
            <div class="space-y-2">
              <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">Meta Information</h4>
              <div class="space-y-2">
                <div v-if="selectedResult._source?.meta?.title">
                  <div class="text-sm font-medium text-gray-500">Title</div>
                  <div class="text-gray-900">{{ selectedResult._source.meta.title }}</div>
                </div>
                <div v-if="selectedResult._source?.meta?.author">
                  <div class="text-sm font-medium text-gray-500">Author</div>
                  <div class="text-gray-900">{{ selectedResult._source.meta.author }}</div>
                </div>
                <div v-if="selectedResult._source?.meta?.date">
                  <div class="text-sm font-medium text-gray-500">Date</div>
                  <div class="text-gray-900">{{ formatDate(selectedResult._source.meta.date) }}</div>
                </div>
                <div v-if="selectedResult._source?.meta?.language">
                  <div class="text-sm font-medium text-gray-500">Language</div>
                  <div class="text-gray-900">{{ selectedResult._source.meta.language }}</div>
                </div>
              </div>
            </div>

            <!-- File Information -->
            <div class="space-y-2">
              <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">File Information</h4>
              <div class="space-y-2">
                <div v-if="selectedResult._source?.file?.filename">
                  <div class="text-sm font-medium text-gray-500">Filename</div>
                  <div class="text-gray-900">{{ selectedResult._source.file.filename }}</div>
                </div>
                <div v-if="selectedResult._source?.file?.filesize">
                  <div class="text-sm font-medium text-gray-500">File Size</div>
                  <div class="text-gray-900">{{ formatFileSize(selectedResult._source.file.filesize) }}</div>
                </div>
              </div>
            </div>

            <!-- Content Preview -->
            <div class="space-y-2">
              <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">Content Preview</h4>
              <div class="bg-gray-50 p-3 rounded-lg">
                <pre class="text-sm text-gray-700 whitespace-pre-wrap">{{ selectedResult._source?.content }}</pre>
              </div>
            </div>

            <!-- Search Score -->
            <div class="space-y-2">
              <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">Search Relevance</h4>
              <div class="flex items-center space-x-2">
                <div class="text-gray-900 font-medium">{{ selectedResult._score.toFixed(2) }}</div>
                <div class="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-500 rounded-full"
                    :style="{ width: `${(selectedResult._score / maxScore) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results Message -->
    <div v-else-if="hasSearched" class="text-center py-8 text-gray-600">
      No results found for your search query.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const results = ref([])
const isLoading = ref(false)
const error = ref(null)
const hasSearched = ref(false)
const selectedResult = ref(null)

const tableHeaders = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'date', label: 'Date' },
  { key: 'language', label: 'Language' },
  { key: 'filename', label: 'File' },
  { key: 'filesize', label: 'Size' },
  { key: 'score', label: 'Score' }
]

const sortKey = ref('score')
const sortOrder = ref('desc')
const filters = ref({
  title: '',
  author: '',
  language: ''
})

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isLoading.value = true
  error.value = null
  hasSearched.value = true
  
  try {
    console.log('Searching for:', searchQuery.value)
    const response = await fetch('http://localhost:9200/test/_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${import.meta.env.VITE_ELASTIC_USERNAME}:${import.meta.env.VITE_ELASTIC_PASSWORD}`)}`
      },
      body: JSON.stringify({
        query: {
          multi_match: {
            query: searchQuery.value,
            fields: ["content", "meta.title", "meta.author"]
          }
        }
      })
    })

    const data = await response.json()
    console.log('Response:', data)

    if (!response.ok) {
      throw new Error('Search request failed')
    }

    results.value = data.hits.hits
    console.log('Found', results.value.length, 'results')
  } catch (e) {
    console.error('Error:', e)
    error.value = `Error performing search: ${e.message}`
    results.value = []
  } finally {
    isLoading.value = false
  }
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'desc'
  }
}

const sortedAndFilteredResults = computed(() => {
  let filteredResults = results.value.filter(result => {
    const title = result._source?.meta?.title || ''
    const author = result._source?.meta?.author || ''
    const language = result._source?.meta?.language || ''
    
    const matchTitle = title.toLowerCase().includes(filters.value.title.toLowerCase())
    const matchAuthor = author.toLowerCase().includes(filters.value.author.toLowerCase())
    const matchLanguage = language.toLowerCase().includes(filters.value.language.toLowerCase())
    
    return matchTitle && matchAuthor && matchLanguage
  })

  return filteredResults.sort((a, b) => {
    let aValue, bValue
    
    switch(sortKey.value) {
      case 'title':
        aValue = a._source?.meta?.title || ''
        bValue = b._source?.meta?.title || ''
        break
      case 'author':
        aValue = a._source?.meta?.author || ''
        bValue = b._source?.meta?.author || ''
        break
      case 'date':
        aValue = new Date(a._source?.meta?.date || 0)
        bValue = new Date(b._source?.meta?.date || 0)
        break
      case 'language':
        aValue = a._source?.meta?.language || ''
        bValue = b._source?.meta?.language || ''
        break
      case 'filename':
        aValue = a._source?.file?.filename || ''
        bValue = b._source?.file?.filename || ''
        break
      case 'filesize':
        aValue = a._source?.file?.filesize || 0
        bValue = b._source?.file?.filesize || 0
        break
      case 'score':
        aValue = a._score || 0
        bValue = b._score || 0
        break
      default:
        aValue = a._score || 0
        bValue = b._score || 0
    }

    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    }
    return aValue < bValue ? 1 : -1
  })
})

const truncateContent = (content) => {
  const maxLength = 200
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatFileSize = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

const maxScore = computed(() => {
  if (!results.value.length) return 1
  return Math.max(...results.value.map(r => r._score))
})
</script>

<style>
.tooltip-container {
  position: relative;
  display: inline-block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tooltip {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  text-align: center;
  padding: 8px 12px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 14px;
  transition: opacity 0.2s, visibility 0.2s;
  pointer-events: none;
  min-width: max-content;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-width: 300px;
  word-break: break-word;
  white-space: normal;
}

.tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

.tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

/* Table styles */
table {
  border-collapse: separate;
  border-spacing: 0;
}

thead th {
  background-color: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 16px;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

thead th:first-child {
  border-top-left-radius: 6px;
}

thead th:last-child {
  border-top-right-radius: 6px;
}

thead th.sortable {
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  position: relative;
  padding-right: 24px;
}

thead th.sortable::before {
  content: '↕';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.3;
  font-size: 14px;
}

thead th.sortable:hover {
  background-color: #e5e7eb;
}

thead th.sortable:hover::before {
  opacity: 0.7;
}

thead th.sortable[data-sorted="asc"]::before {
  content: '↑';
  opacity: 1;
  color: #2563eb;
}

thead th.sortable[data-sorted="desc"]::before {
  content: '↓';
  opacity: 1;
  color: #2563eb;
}

thead th.sortable::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  transition: background-color 0.2s;
}

thead th.sortable:hover::after {
  background: #2563eb;
}

tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background-color: #f1f5f9;
}

/* Filter inputs */
input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;
  color: #1e293b;
}

input[type="text"]::placeholder {
  color: #94a3b8;
}

input[type="text"]:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Add a subtle hint about sortable columns */
thead tr:first-child::after {
  content: 'Click headers to sort';
  position: absolute;
  top: -24px;
  right: 8px;
  font-size: 12px;
  color: #64748b;
  font-weight: normal;
  text-transform: none;
  letter-spacing: normal;
}

/* Add styles for the details panel */
.sticky {
  position: sticky;
  top: 1.5rem;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
}

/* Style the scrollbar for the details panel */
.sticky::-webkit-scrollbar {
  width: 8px;
}

.sticky::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.sticky::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.sticky::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Ensure content in pre tags wraps properly */
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
}
</style>
