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
      <!-- Results count -->
      <div class="text-sm text-gray-600">
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalHits) }} of {{ totalHits }} results
      </div>
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
              <input 
                v-if="header.key === 'owner'" 
                v-model="filters.owner" 
                type="text" 
                placeholder="Filter by owner" 
                class="w-full p-1 text-sm border rounded"
              >
              <input 
                v-if="header.key === 'group'" 
                v-model="filters.group" 
                type="text" 
                placeholder="Filter by group" 
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

      <!-- Pagination Controls -->
      <div class="mt-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <select 
            v-model="itemsPerPage" 
            class="border rounded p-1"
            @change="currentPage = 1"
          >
            <option :value="10">10 per page</option>
            <option :value="25">25 per page</option>
            <option :value="50">50 per page</option>
            <option :value="100">100 per page</option>
          </select>
        </div>
        <div class="flex space-x-2">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span class="px-3 py-1">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
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
import { ref, computed, watch } from 'vue'
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
const currentPage = ref(1)
const itemsPerPage = ref(25)
const totalHits = ref(0)

const filters = ref({
  title: '',
  author: '',
  language: '',
  owner: '',
  group: ''
})

const tableHeaders = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'date', label: 'Date' },
  { key: 'language', label: 'Language' },
  { key: 'filename', label: 'File' },
  { key: 'filesize', label: 'Size' },
  { key: 'owner', label: 'Owner' },
  { key: 'group', label: 'Group' },
  { key: 'score', label: 'Score' }
]

const maxScore = computed(() => {
  if (!results.value.length) return 1
  return Math.max(...results.value.map(r => r._score))
})

// Compute total pages
const totalPages = computed(() => Math.ceil(totalHits.value / itemsPerPage.value))

// Compute paginated results
// Watch for changes in filters that require a new search
// Watch for filter changes
watch([filters], async () => {
  if (hasSearched.value) {
    currentPage.value = 1 // Reset to first page when filters change
    await performSearch()
  }
}, { deep: true })

// Watch for pagination changes
watch([currentPage, itemsPerPage], async () => {
  if (hasSearched.value) {
    await performSearch()
  }
})

// Compute sorted and filtered results
const sortedAndFilteredResults = computed(() => {
  // Just apply sorting since filtering is now handled by the server
  const sortedResults = [...results.value]

  return sortedResults.sort((a, b) => {
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
    case 'owner':
      return result._source?.attributes?.owner || ''
    case 'group':
      return result._source?.attributes?.group || ''
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
  
  // Only reset page on new search, not on pagination changes
  if (!hasSearched.value) {
    currentPage.value = 1
  }
  
  try {
    const response = await fetch('http://localhost:3000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: searchQuery.value,
        page: currentPage.value,
        size: itemsPerPage.value,
        filters: {
          title: filters.value.title,
          author: filters.value.author,
          language: filters.value.language,
          owner: filters.value.owner,
          group: filters.value.group
        }
      })
    })
    
    if (!response.ok) {
      throw new Error('Search request failed')
    }
    
    const data = await response.json()
    results.value = data.hits.hits
    totalHits.value = data.hits.total.value
    selectedResult.value = null
  } catch (err) {
    error.value = 'Failed to perform search. Please try again.'
    results.value = []
    totalHits.value = 0
  } finally {
    isLoading.value = false
  }
}
</script>
