<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useVideoThumbnail } from '../../composables/useVideoThumbnail'

const props = defineProps({
  videoFile: {
    type: [File, Object],
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  currentTime: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['time-select', 'loaded', 'time-drag'])

const containerRef = ref(null)
const canvasRef = ref(null)
const waveformData = ref([])
const { thumbnails, isGenerating, progress, generateFromUrl, clearThumbnails } = useVideoThumbnail()

// 计算当前播放位置对应的缩略图索引
const currentIndex = computed(() => {
  if (!props.duration || thumbnails.value.length === 0) return 0
  const ratio = props.currentTime / props.duration
  return Math.min(Math.floor(ratio * thumbnails.value.length), thumbnails.value.length - 1)
})

// 计算当前播放位置的像素坐标
const currentX = computed(() => {
  if (!props.duration || !canvasRef.value) return 0
  const ratio = props.currentTime / props.duration
  return ratio * canvasRef.value.width
})

// 监听视频变化，重新生成缩略图
watch(() => props.videoUrl, (newUrl) => {
  if (newUrl) {
    loadThumbnails()
  } else {
    clearThumbnails()
    waveformData.value = []
  }
}, { immediate: true })

// 监听当前时间变化，自动滚动缩略图
watch(() => props.currentTime, () => {
  // 连续时间线不需要滚动，只需重绘播放头
  drawPlaybackHead()
})

// 加载缩略图并生成波形数据
async function loadThumbnails() {
  try {
    const result = await generateFromUrl(props.videoUrl, 30, 100, 56)
    emit('loaded', result)
    
    // 生成波形数据
    await generateWaveform(result)
  } catch (error) {
    console.error('加载缩略图失败:', error)
  }
}

/**
 * 从缩略图生成简化的波形数据
 */
async function generateWaveform(thumbnails) {
  // 使用缩略图的亮度信息模拟波形
  const waveform = thumbnails.map((thumb, index) => {
    // 简化的波形值（0-1），实际项目中可以使用 Web Audio API 分析音频
    const normalizedIndex = index / thumbnails.length
    // 使用正弦波模拟波形效果
    const baseWave = Math.sin(normalizedIndex * Math.PI * 4) * 0.5 + 0.5
    const variation = Math.random() * 0.3 + 0.7
    return baseWave * variation
  })
  
  waveformData.value = waveform
  nextTick(() => {
    drawWaveform()
  })
}

/**
 * 绘制波形图
 */
function drawWaveform() {
  const canvas = canvasRef.value
  if (!canvas || waveformData.value.length === 0) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const barWidth = width / waveformData.value.length
  const barGap = 1
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 绘制背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, 0, width, height)
  
  // 绘制波形
  waveformData.value.forEach((amplitude, index) => {
    const x = index * barWidth
    const barHeight = amplitude * height * 0.8
    const y = (height - barHeight) / 2
    
    // 渐变填充
    const gradient = ctx.createLinearGradient(x, 0, x, height)
    gradient.addColorStop(0, 'rgba(170, 59, 255, 0.8)')
    gradient.addColorStop(0.5, 'rgba(170, 59, 255, 1)')
    gradient.addColorStop(1, 'rgba(170, 59, 255, 0.8)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight)
  })
  
  // 绘制时间刻度
  drawTimeMarkers(ctx, width, height)
  
  // 绘制播放头
  drawPlaybackHead()
}

/**
 * 绘制时间刻度 - 只绘制起点和终点
 */
function drawTimeMarkers(ctx, width, height) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'

  // 只绘制起点 (00:00) 和终点时间
  const startTime = '00:00'
  const endTime = formatTime(props.duration)

  // 绘制起点时间
  ctx.fillText(startTime, 0, height - 4)

  // 绘制终点时间
  ctx.fillText(endTime, width, height - 4)
}

/**
 * 绘制播放头
 */
function drawPlaybackHead() {
  const canvas = canvasRef.value
  if (!canvas || !props.duration) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const x = currentX.value
  
  // 重绘波形（清除旧播放头）
  drawWaveformWithoutHead()
  
  // 绘制播放头线
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, height * 0.85)
  ctx.stroke()
  
  // 绘制播放头三角形
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(x - 6, 0)
  ctx.lineTo(x + 6, 0)
  ctx.lineTo(x, 8)
  ctx.closePath()
  ctx.fill()
}

/**
 * 绘制波形（不包含播放头）
 */
function drawWaveformWithoutHead() {
  const canvas = canvasRef.value
  if (!canvas || waveformData.value.length === 0) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height * 0.85
  const barWidth = width / waveformData.value.length
  const barGap = 1
  
  ctx.clearRect(0, 0, width, height)
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, 0, width, height)
  
  waveformData.value.forEach((amplitude, index) => {
    const x = index * barWidth
    const barHeight = amplitude * height * 0.8
    const y = (height - barHeight) / 2
    
    const gradient = ctx.createLinearGradient(x, 0, x, height)
    gradient.addColorStop(0, 'rgba(170, 59, 255, 0.8)')
    gradient.addColorStop(0.5, 'rgba(170, 59, 255, 1)')
    gradient.addColorStop(1, 'rgba(170, 59, 255, 0.8)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight)
  })
  
  drawTimeMarkers(ctx, width, height)
}

/**
 * 格式化时间
 */
function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * 点击时间线跳转时间
 */
function onTimelineClick(event) {
  if (!canvasRef.value || !props.duration) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const ratio = x / rect.width
  const time = ratio * props.duration
  
  emit('time-select', Math.max(0, Math.min(time, props.duration)))
}

/**
 * 拖拽时间线
 */
function onTimelineDrag(event) {
  if (!canvasRef.value || !props.duration) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const ratio = x / rect.width
  const time = ratio * props.duration
  
  emit('time-drag', Math.max(0, Math.min(time, props.duration)))
}
</script>

<template>
  <div class="thumbnail-timeline">
    <!-- 加载状态 -->
    <div v-if="isGenerating" class="loading-overlay">
      <div class="loading-spinner">
        <svg class="spinner" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke-width="4" />
        </svg>
      </div>
      <p class="loading-text">生成波形图中... {{ Math.round(progress) }}%</p>
    </div>

    <!-- 连续波形时间线 -->
    <div class="timeline-wrapper">
      <canvas
        ref="canvasRef"
        class="waveform-canvas"
        :width="800"
        :height="120"
        @click="onTimelineClick"
        @mousedown="onTimelineDrag"
        @mousemove="onTimelineDrag"
        @mouseup="() => {}"
        @mouseleave="() => {}"
      />
    </div>

    <!-- 时间信息 -->
    <div class="time-info">
      <span class="current-time">{{ formatTime(currentTime) }}</span>
      <span class="total-time">{{ formatTime(duration) }}</span>
    </div>
  </div>
</template>

<style scoped>
.thumbnail-timeline {
  position: relative;
  width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.loading-spinner {
  margin-bottom: 16px;
}

.spinner {
  width: 50px;
  height: 50px;
  animation: rotate 1.4s linear infinite;
}

.spinner circle {
  stroke: var(--accent);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.loading-text {
  color: #fff;
  font-size: 14px;
  margin: 0;
}

.timeline-wrapper {
  position: relative;
  width: 100%;
  padding: 8px 0;
}

.waveform-canvas {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.2);
  transition: background 0.2s ease;
}

.waveform-canvas:hover {
  background: rgba(0, 0, 0, 0.3);
}

.time-info {
  display: flex;
  justify-content: space-between;
  padding: 8px 4px;
  font-size: 12px;
  color: var(--text);
  font-family: var(--mono);
}

.current-time {
  color: var(--accent);
  font-weight: 500;
}

.total-time {
  color: var(--text);
  opacity: 0.7;
}
</style>
