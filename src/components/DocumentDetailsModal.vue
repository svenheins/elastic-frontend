<template>
  <div v-if="modelValue" class="modal-overlay">
    <div class="modal-backdrop" @click="$emit('update:modelValue', null)"></div>
    <div class="modal-container">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-gray-900">Document Details</h3>
          <button 
            @click="$emit('update:modelValue', null)"
            class="text-gray-400 hover:text-gray-600 p-2"
          >
            ✕
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Meta Information -->
          <div class="space-y-4">
            <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">Meta Information</h4>
            <table class="w-full">
              <tbody>
                <template v-if="document._source?.meta">
                  <tr v-for="(value, key) in document._source.meta" :key="key" class="border-b border-gray-100">
                    <td class="py-2 pr-4 text-sm font-medium text-gray-500 capitalize w-1/3">{{ key }}</td>
                    <td class="py-2 text-gray-900">{{ key === 'date' ? formatDate(value) : value }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- File Information -->
          <div class="space-y-4">
            <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">File Information</h4>
            <table class="w-full">
              <tbody>
                <template v-if="document._source?.file">
                  <tr v-if="document._source.file.filename" class="border-b border-gray-100">
                    <td class="py-2 pr-4 text-sm font-medium text-gray-500 w-1/3">Filename</td>
                    <td class="py-2 text-gray-900">{{ document._source.file.filename }}</td>
                  </tr>
                  <tr v-if="document._source.file.filesize" class="border-b border-gray-100">
                    <td class="py-2 pr-4 text-sm font-medium text-gray-500 w-1/3">File Size</td>
                    <td class="py-2 text-gray-900">{{ formatFileSize(document._source.file.filesize) }}</td>
                  </tr>
                </template>
                <template v-if="document._source?.attributes">
                  <tr v-if="document._source.attributes.owner" class="border-b border-gray-100">
                    <td class="py-2 pr-4 text-sm font-medium text-gray-500 w-1/3">Owner</td>
                    <td class="py-2 text-gray-900">{{ document._source.attributes.owner }}</td>
                  </tr>
                  <tr v-if="document._source.attributes.group" class="border-b border-gray-100">
                    <td class="py-2 pr-4 text-sm font-medium text-gray-500 w-1/3">Group</td>
                    <td class="py-2 text-gray-900">{{ document._source.attributes.group }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Metadata Information -->
          <div v-if="document._source?.metadata" class="space-y-4">
            <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">Metadata</h4>
            <table class="w-full">
              <tbody>
                <template v-for="(category, categoryKey) in document._source.metadata" :key="categoryKey">
                  <!-- Category Header -->
                  <tr v-if="typeof category === 'object'" class="border-b border-gray-100">
                    <td colspan="2" class="py-2 text-sm font-semibold text-gray-600">{{ formatTitle(categoryKey) }}</td>
                  </tr>
                  <!-- Category Content -->
                  <template v-if="typeof category === 'object'">
                    <tr v-for="(value, key) in category" :key="categoryKey + '-' + key" class="border-b border-gray-100">
                      <td class="py-2 pr-4 text-sm font-medium text-gray-500 capitalize w-1/3">{{ formatTitle(key) }}</td>
                      <td class="py-2 text-gray-900">
                        <template v-if="Array.isArray(value)">
                          {{ value.join(', ') }}
                        </template>
                        <template v-else-if="typeof value === 'number' && key.includes('score')">
                          {{ value.toFixed(2) }}
                        </template>
                        <template v-else-if="typeof value === 'string' && (key.includes('date') || key.includes('time'))">
                          {{ formatDate(value) }}
                        </template>
                        <template v-else-if="typeof value === 'object'">
                          <div v-for="(nestedValue, nestedKey) in value" :key="nestedKey" class="py-1">
                            <span class="text-gray-600">{{ formatTitle(nestedKey) }}:</span> {{ nestedValue }}
                          </div>
                        </template>
                        <template v-else>
                          {{ value }}
                        </template>
                      </td>
                    </tr>
                  </template>
                  <!-- Non-object values -->
                  <tr v-else class="border-b border-gray-100">
                    <td class="py-2 pr-4 text-sm font-medium text-gray-500 capitalize w-1/3">{{ formatTitle(categoryKey) }}</td>
                    <td class="py-2 text-gray-900">{{ category }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Content Preview -->
          <div class="space-y-4">
            <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">Content Preview</h4>
            <div class="bg-gray-50 p-4 rounded-lg">
              <pre class="text-sm text-gray-700 whitespace-pre-wrap">{{ document._source?.content }}</pre>
            </div>
          </div>

          <!-- Search Score -->
          <div class="space-y-4">
            <h4 class="font-medium text-sm text-gray-500 uppercase tracking-wider">Search Relevance</h4>
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-100">
                  <td class="py-2 pr-4 text-sm font-medium text-gray-500 w-1/3">Score</td>
                  <td class="py-2">
                    <div class="flex items-center space-x-3">
                      <div class="text-gray-900 font-medium">{{ document._score.toFixed(2) }}</div>
                      <div class="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-blue-500 rounded-full"
                          :style="{ width: `${(document._score / maxScore) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  document: {
    type: Object,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  }
})

defineEmits(['update:modelValue'])

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatFileSize = (bytes) => {
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

const formatTitle = (text) => {
  if (!text) return ''
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-container {
  position: relative;
  z-index: 1001;
  width: 90%;
  max-width: 800px;
  margin: 2rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  position: sticky;
  top: 0;
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}
</style>
