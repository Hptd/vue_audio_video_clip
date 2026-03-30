<script setup>
import { ref, watch } from 'vue'
import Modal from '../common/Modal.vue'
import VideoPlayer from './VideoPlayer.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'confirm'])

const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)

// 监听文件变化，重置状态
watch(() => props.file, () => {
  currentTime.value = 0
  duration.value = 0
  isPlaying.value = false
})

function handleClose() {
  emit('close')
}

function handleConfirm() {
  // TODO: 后续实现剪辑功能
  console.log('确认剪辑:', {
    start: 0,
    end: currentTime.value
  })
  emit('confirm', { start: 0, end: currentTime.value })
}

function onTimeUpdate(time) {
  currentTime.value = time
}

function onDurationChange(newDuration) {
  duration.value = newDuration
}

function onPlayStateChange(playing) {
  isPlaying.value = playing
}
</script>

<template>
  <Modal 
    :show="show" 
    :title="file ? `编辑视频 - ${file.name}` : '视频编辑'" 
    @close="handleClose"
  >
    <div class="video-editor">
      <!-- 视频播放区域 -->
      <div class="video-section">
        <VideoPlayer
          v-if="file?.url"
          :src="file.url"
          @time-update="onTimeUpdate"
          @duration-change="onDurationChange"
          @play-state-change="onPlayStateChange"
        />
      </div>

      <!-- 信息提示区域 -->
      <div class="info-section">
        <div class="time-info">
          <span>当前时间：{{ currentTime.toFixed(2) }}s</span>
          <span>总时长：{{ duration.toFixed(2) }}s</span>
        </div>
        <p class="hint">提示：后续将在此处添加缩略图时间轴和剪辑功能</p>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-cancel" @click="handleClose">取消</button>
      <button class="btn btn-confirm" @click="handleConfirm">确认</button>
    </template>
  </Modal>
</template>

<style scoped>
.video-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-section {
  width: 100%;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--code-bg);
  border-radius: 8px;
}

.time-info {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--text-h);
  font-family: var(--mono);
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text);
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: var(--code-bg);
  color: var(--text);
}

.btn-cancel:hover {
  background: var(--border);
}

.btn-confirm {
  background: var(--accent);
  color: #fff;
}

.btn-confirm:hover {
  opacity: 0.9;
}
</style>
