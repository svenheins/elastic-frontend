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
      <table class="min-w-full bg-white border">
        <thead>
          <tr>
            <th 
              v-for="header in tableHeaders" 
              :key="header.key"
              @click="sortBy(header.key)"
              class="p-2 border cursor-pointer hover:bg-gray-50"
            >
              {{ header.label }}
              <span v-if="sortKey === header.key">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
          <tr>
            <th v-for="header in tableHeaders" :key="header.key" class="p-2 border">
              <input 
                v-if="header.key === 'title'" 
                v-model="filters.title" 
                type="text" 
                placeholder="Filter by title" 
                class="w-full p-1 border rounded text-sm"
              >
              <input 
                v-if="header.key === 'author'" 
                v-model="filters.author" 
                type="text" 
                placeholder="Filter by author" 
                class="w-full p-1 border rounded text-sm"
              >
              <input 
                v-if="header.key === 'language'" 
                v-model="filters.language" 
                type="text" 
                placeholder="Filter by language" 
                class="w-full p-1 border rounded text-sm"
              >
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in sortedAndFilteredResults" :key="result._id" class="hover:bg-gray-50">
            <td class="p-2 border">
              <div class="tooltip-container">
                {{ result._source?.meta?.title || '' }}
                <span class="tooltip">{{ result._source?.meta?.title || '' }}</span>
              </div>
            </td>
            <td class="p-2 border">
              <div class="tooltip-container">
                {{ result._source?.meta?.author || '' }}
                <span class="tooltip">{{ result._source?.meta?.author || '' }}</span>
              </div>
            </td>
            <td class="p-2 border">
              <div class="tooltip-container">
                {{ formatDate(result._source?.meta?.date || 0) }}
                <span class="tooltip">{{ formatDate(result._source?.meta?.date || 0) }}</span>
              </div>
            </td>
            <td class="p-2 border">
              <div class="tooltip-container">
                {{ result._source?.meta?.language || '' }}
                <span class="tooltip">{{ result._source?.meta?.language || '' }}</span>
              </div>
            </td>
            <td class="p-2 border">
              <div class="tooltip-container">
                {{ result._source?.file?.filename || '' }}
                <span class="tooltip">{{ result._source?.file?.filename || '' }}</span>
              </div>
            </td>
            <td class="p-2 border">
              <div class="tooltip-container">
                {{ formatFileSize(result._source?.file?.filesize || 0) }}
                <span class="tooltip">{{ formatFileSize(result._source?.file?.filesize || 0) }}</span>
              </div>
            </td>
            <td class="p-2 border">
              <div class="tooltip-container">
                {{ (result._score || 0).toFixed(2) }}
                <span class="tooltip">Relevance Score: {{ result._score || 0 }}</span>
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const results = ref([])
const isLoading = ref(false)
const error = ref(null)
const hasSearched = ref(false)

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
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  text-align: center;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 14px;
}

.tooltip-container:hover .tooltip {
  visibility: visible;
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
</style>
