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
                class="w-full p-1 text-sm border rounded"
              >
              <input 
                v-if="header.key === 'author'" 
                v-model="filters.author" 
                type="text" 
                placeholder="Filter by author" 
                class="w-full p-1 text-sm border rounded"
              >
              <input 
                v-if="header.key === 'language'" 
                v-model="filters.language" 
                type="text" 
                placeholder="Filter by language" 
                class="w-full p-1 text-sm border rounded"
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
            <td v-for="header in tableHeaders" :key="header.key">
              <div class="tooltip-container">
                {{ getCellContent(result, header.key) }}
                <div class="tooltip">{{ getCellTooltip(result, header.key) }}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- No Results Message -->
    <div v-else-if="hasSearched" class="text-center py-8 text-gray-600">
      No results found for your search query.
    </div>

    <!-- Details Modal -->
    <DocumentDetailsModal
      v-model="selectedResult"
      :document="selectedResult || {}"
      :max-score="maxScore"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DocumentDetailsModal from './components/DocumentDetailsModal.vue'
import './assets/styles.css'

const searchQuery = ref('')
const results = ref([])
const selectedResult = ref(null)
const isLoading = ref(false)
const error = ref('')
const sortKey = ref('score')
const sortOrder = ref('desc')
const hasSearched = ref(false)

const filters = ref({
  title: '',
  author: '',
  language: ''
})

const tableHeaders = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'date', label: 'Date' },
  { key: 'language', label: 'Language' },
  { key: 'filename', label: 'File' },
  { key: 'filesize', label: 'Size' },
  { key: 'score', label: 'Score' }
]

const maxScore = computed(() => {
  if (!results.value.length) return 1
  return Math.max(...results.value.map(r => r._score))
})

const sortedAndFilteredResults = computed(() => {
  let filteredResults = results.value.filter(result => {
    const title = result._source?.meta?.title || ''
    const author = result._source?.meta?.author || ''
    const language = result._source?.meta?.language || ''
    
    return (
      title.toLowerCase().includes(filters.value.title.toLowerCase()) &&
      author.toLowerCase().includes(filters.value.author.toLowerCase()) &&
      language.toLowerCase().includes(filters.value.language.toLowerCase())
    )
  })

  return filteredResults.sort((a, b) => {
    let aValue = getValue(a, sortKey.value)
    let bValue = getValue(b, sortKey.value)
    
    if (sortOrder.value === 'desc') {
      ;[aValue, bValue] = [bValue, aValue]
    }
    
    if (typeof aValue === 'string') {
      return aValue.localeCompare(bValue)
    }
    return aValue - bValue
  })
})

function getValue(result, key) {
  switch (key) {
    case 'title':
      return result._source?.meta?.title || ''
    case 'author':
      return result._source?.meta?.author || ''
    case 'date':
      return result._source?.meta?.date || 0
    case 'language':
      return result._source?.meta?.language || ''
    case 'filename':
      return result._source?.file?.filename || ''
    case 'filesize':
      return result._source?.file?.filesize || 0
    case 'score':
      return result._score || 0
    default:
      return ''
  }
}

function getCellContent(result, key) {
  const value = getValue(result, key)
  if (key === 'date') return formatDate(value)
  if (key === 'filesize') return formatFileSize(value)
  if (key === 'score') return value.toFixed(2)
  return value
}

function getCellTooltip(result, key) {
  const value = getValue(result, key)
  if (key === 'filesize') return `Size: ${formatFileSize(value)}`
  if (key === 'score') return `Relevance Score: ${value}`
  if (!value) return `No ${key} available`
  return value
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

async function performSearch() {
  if (!searchQuery.value.trim()) return
  
  isLoading.value = true
  error.value = ''
  hasSearched.value = true
  
  try {
    const response = await fetch('http://localhost:3000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: searchQuery.value
      })
    })
    
    if (!response.ok) {
      throw new Error('Search request failed')
    }
    
    const data = await response.json()
    results.value = data.hits.hits
    selectedResult.value = null
  } catch (err) {
    error.value = 'Failed to perform search. Please try again.'
    results.value = []
  } finally {
    isLoading.value = false
  }
}
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
