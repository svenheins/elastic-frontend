<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
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
  </Teleport>
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
</script>
