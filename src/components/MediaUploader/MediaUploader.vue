<script setup>
import { ref } from 'vue'
import { useMediaUpload } from '../../composables/useMediaUpload'
import UploadItem from './UploadItem.vue'

const { files, handleFileSelect, removeFile } = useMediaUpload()

const fileInputRef = ref(null)

const ACCEPT_TYPES = 'video/*,audio/*'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

function triggerUpload() {
  fileInputRef.value?.click()
}

function onFileChange(event) {
  const selectedFiles = Array.from(event.target.files || [])
  handleFileSelect(selectedFiles)
  // 重置 input，允许重复选择同一文件
  event.target.value = ''
}

function onDrop(event) {
  event.preventDefault()
  const droppedFiles = Array.from(event.dataTransfer?.files || [])
  handleFileSelect(droppedFiles)
}

function onDragOver(event) {
  event.preventDefault()
}
</script>

<template>
  <div class="media-uploader">
    <h2>媒体文件上传</h2>
    
    <!-- 上传区域 -->
    <div 
      class="upload-area"
      @click="triggerUpload"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <div class="upload-content">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p class="upload-text">点击或拖拽文件到此处上传</p>
        <p class="upload-hint">支持视频 (mp4, webm, mov) 和音频 (mp3, wav, ogg) 格式，最大 100MB</p>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        :accept="ACCEPT_TYPES"
        multiple
        @change="onFileChange"
        class="file-input"
      />
    </div>

    <!-- 文件列表 -->
    <div v-if="files.length > 0" class="file-list">
      <h3>已上传文件 ({{ files.length }})</h3>
      <div class="files">
        <UploadItem
          v-for="file in files"
          :key="file.id"
          :file="file"
          @remove="removeFile"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-uploader {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
}

.upload-area {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 48px 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg);
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--accent);
}

.upload-text {
  font-size: 18px;
  color: var(--text-h);
  margin: 0;
}

.upload-hint {
  font-size: 14px;
  color: var(--text);
  margin: 0;
}

.file-input {
  display: none;
}

.file-list {
  margin-top: 32px;
}

.file-list h3 {
  font-size: 18px;
  color: var(--text-h);
  margin-bottom: 16px;
  text-align: left;
}

.files {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
