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
      <div v-for="result in results" :key="result._id" class="bg-white p-4 rounded shadow">
        <!-- Title -->
        <h2 class="text-xl font-semibold mb-2">{{ result._source.meta.title }}</h2>
        
        <!-- Meta Information -->
        <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p><strong>Author:</strong> {{ result._source.meta.author }}</p>
            <p><strong>Date:</strong> {{ formatDate(result._source.meta.date) }}</p>
            <p><strong>Language:</strong> {{ result._source.meta.language }}</p>
          </div>
          <div>
            <p><strong>File:</strong> {{ result._source.file.filename }}</p>
            <p><strong>Size:</strong> {{ formatFileSize(result._source.file.filesize) }}</p>
            <p><strong>Format:</strong> {{ result._source.meta.format }}</p>
          </div>
        </div>

        <!-- Content Preview -->
        <div class="bg-gray-50 p-3 rounded">
          <h3 class="font-semibold mb-2">Content Preview:</h3>
          <p class="text-sm">{{ truncateContent(result._source.content) }}</p>
        </div>

        <!-- Score -->
        <div class="mt-2 text-sm text-gray-600">
          Relevance Score: {{ result._score }}
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
import { ref } from 'vue'

const searchQuery = ref('')
const results = ref([])
const isLoading = ref(false)
const error = ref(null)
const hasSearched = ref(false)

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const response = await fetch('http://localhost:9200/test/_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    if (!response.ok) {
      throw new Error('Search request failed')
    }

    const data = await response.json()
    results.value = data.hits.hits
    hasSearched.value = true
  } catch (err) {
    error.value = `Error performing search: ${err.message}`
    results.value = []
  } finally {
    isLoading.value = false
  }
}

const truncateContent = (content) => {
  if (!content) return ''
  const words = content.split(' ')
  const preview = words.slice(0, 50).join(' ')
  return words.length > 50 ? `${preview}...` : preview
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style>
/* Add any custom styles here if needed */
</style>
