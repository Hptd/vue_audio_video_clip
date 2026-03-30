<script setup>
import { computed, ref } from 'vue'
import VideoEditor from '../VideoEditor/VideoEditor.vue'

const props = defineProps({
  file: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['remove'])

const isVideo = computed(() => props.file.type === 'video')
const isAudio = computed(() => props.file.type === 'audio')

const showEditor = computed(() => isVideo.value && editorOpen.value)

const mediaType = computed(() => {
  if (isVideo.value) return '视频'
  if (isAudio.value) return '音频'
  return '未知'
})

const fileSize = computed(() => {
  const bytes = props.file.size
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB'
  }
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
})

// 编辑器状态
const editorOpen = ref(false)

/**
 * 格式化时长显示
 * @param {number} seconds - 时长（秒）
 * @returns {string} 格式化后的时长
 */
function formatDuration(seconds) {
  if (!seconds || seconds === Infinity) return '--:--'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function handleRemove() {
  emit('remove', props.file.id)
}

function handleEdit() {
  if (isVideo.value) {
    editorOpen.value = true
  }
}

function handleCloseEditor() {
  editorOpen.value = false
}

function handleConfirmEditor(clipRange) {
  console.log('剪辑范围:', clipRange)
  editorOpen.value = false
  // TODO: 后续实现剪辑功能
}
</script>

<template>
  <div class="upload-item">
    <!-- 媒体预览 -->
    <div class="media-preview">
      <video 
        v-if="isVideo" 
        :src="file.url" 
        controls
        preload="metadata"
      />
      <audio 
        v-else-if="isAudio" 
        :src="file.url" 
        controls
        preload="metadata"
      />
    </div>

    <!-- 文件信息 -->
    <div class="file-info">
      <div class="file-meta">
        <span class="file-type" :class="file.type">{{ mediaType }}</span>
        <span class="file-name" :title="file.name">{{ file.name }}</span>
      </div>
      <div class="file-details">
        <span class="file-size">{{ fileSize }}</span>
        <span v-if="file.duration" class="file-duration">
          {{ formatDuration(file.duration) }}
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="file-actions">
      <button 
        class="btn btn-edit" 
        :disabled="!isVideo"
        :title="isVideo ? '编辑视频' : '音频编辑功能待开发'"
        @click="handleEdit"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        编辑
      </button>
      <button class="btn btn-delete" @click="handleRemove" title="删除文件">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        删除
      </button>
    </div>
  </div>
  
  <!-- 视频编辑器弹窗 -->
  <VideoEditor
    v-if="showEditor"
    :show="showEditor"
    :file="file"
    @close="handleCloseEditor"
    @confirm="handleConfirmEditor"
  />
</template>

<style scoped>
.upload-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  transition: box-shadow 0.3s ease;
}

.upload-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.media-preview {
  flex-shrink: 0;
  width: 160px;
}

.media-preview video,
.media-preview audio {
  width: 100%;
  border-radius: 4px;
  background: #000;
}

.media-preview audio {
  height: 40px;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.file-type.video {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.file-type.audio {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.file-name {
  font-size: 14px;
  color: var(--text-h);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-details {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text);
}

.file-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn-edit {
  background: var(--code-bg);
  color: var(--text);
}

.btn-edit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-edit:not(:disabled):hover {
  background: var(--border);
}

.btn-delete {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.btn-delete:hover {
  background: #ef4444;
  color: #fff;
}

@media (max-width: 640px) {
  .upload-item {
    flex-direction: column;
  }

  .media-preview {
    width: 100%;
  }

  .file-actions {
    flex-direction: row;
  }

  .btn {
    flex: 1;
  }
}
</style>
