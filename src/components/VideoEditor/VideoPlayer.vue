<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useVideoPlayer } from '../../composables/useVideoPlayer'
import TimeDisplay from './TimeDisplay.vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['time-update', 'duration-change', 'play-state-change'])

const videoRef = ref(null)
const progressContainerRef = ref(null)
const animationFrameId = ref(null)

const {
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  isSeeking,
  buffered,
  formatTime,
  togglePlay,
  seek,
  setVolume,
  toggleMute,
  toggleFullscreen,
  onLoadedMetadata,
  onPlay,
  onPause,
  onProgress,
  onEnded
} = useVideoPlayer(videoRef)

/**
 * 使用 requestAnimationFrame 循环更新时间
 */
function startUpdateLoop() {
  function update() {
    if (videoRef.value && !videoRef.value.paused && !videoRef.value.ended) {
      currentTime.value = videoRef.value.currentTime
      emit('time-update', currentTime.value)
    }
    animationFrameId.value = requestAnimationFrame(update)
  }
  animationFrameId.value = requestAnimationFrame(update)
}

/**
 * 停止更新循环
 */
function stopUpdateLoop() {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }
}

// 监听播放状态，启动/停止更新循环
watch(isPlaying, (newPlaying) => {
  emit('play-state-change', newPlaying)
  if (newPlaying) {
    startUpdateLoop()
  } else {
    stopUpdateLoop()
  }
})

// 监听时长变化
watch(duration, (newDuration) => {
  emit('duration-change', newDuration)
})

// 组件卸载时清理
onUnmounted(() => {
  stopUpdateLoop()
})

/**
 * 处理进度条点击
 */
function onProgressClick(event) {
  if (!progressContainerRef.value || !duration.value) return
  
  const rect = progressContainerRef.value.getBoundingClientRect()
  const pos = (event.clientX - rect.left) / rect.width
  seek(pos * duration.value)
}

/**
 * 处理进度条拖拽
 */
function onProgressDrag(event) {
  if (!progressContainerRef.value || !duration.value) return
  
  isSeeking.value = true
  const rect = progressContainerRef.value.getBoundingClientRect()
  const pos = (event.clientX - rect.left) / rect.width
  const time = pos * duration.value
  
  if (videoRef.value) {
    videoRef.value.currentTime = Math.max(0, Math.min(time, duration.value))
    currentTime.value = time
  }
}

/**
 * 结束拖拽
 */
function onProgressDragEnd(event) {
  if (!isSeeking.value) return
  isSeeking.value = false
  
  if (videoRef.value) {
    videoRef.value.currentTime = currentTime.value
  }
}

/**
 * 获取音量图标
 */
function getVolumeIcon() {
  if (isMuted.value || volume.value === 0) {
    return 'volume-off'
  } else if (volume.value < 0.5) {
    return 'volume-down'
  } else {
    return 'volume-up'
  }
}

// 暴露 seek 方法给父组件
defineExpose({
  seek
})
</script>

<template>
  <div class="video-player-container">
    <div class="video-player" :class="{ 'is-fullscreen': isFullscreen }">
      <!-- 视频元素 -->
      <video
        ref="videoRef"
        :src="src"
        :poster="poster"
        @loadedmetadata="onLoadedMetadata"
        @play="onPlay"
        @pause="onPause"
        @progress="onProgress"
        @ended="onEnded"
        @click="togglePlay"
      />

      <!-- 控制栏 -->
      <div class="controls">
        <!-- 进度条 -->
        <div 
          ref="progressContainerRef"
          class="progress-container"
          @click="onProgressClick"
          @mousedown="onProgressDrag"
          @mousemove="onProgressDrag"
          @mouseup="onProgressDragEnd"
          @mouseleave="onProgressDragEnd"
        >
          <!-- 缓冲进度 -->
          <div class="progress-buffered" :style="{ width: buffered + '%' }" />
          <!-- 播放进度 -->
          <div 
            class="progress-bar" 
            :style="{ width: duration ? (currentTime / duration) * 100 + '%' : '0%' }"
          />
          <!-- 拖拽手柄 -->
          <div 
            class="progress-handle"
            :style="{ left: duration ? (currentTime / duration) * 100 + '%' : '0%' }"
          />
        </div>

        <!-- 控制按钮 -->
        <div class="controls-bottom">
          <!-- 左侧按钮组 -->
          <div class="controls-left">
            <!-- 播放/暂停 -->
            <button class="control-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
              <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <!-- 音量控制 -->
            <div class="volume-control">
              <button class="control-btn" @click="toggleMute" :title="isMuted ? '取消静音' : '静音'">
                <svg v-if="getVolumeIcon() === 'volume-off'" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
                <svg v-else-if="getVolumeIcon() === 'volume-down'" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>
              <input
                type="range"
                class="volume-slider"
                min="0"
                max="1"
                step="0.01"
                :value="isMuted ? 0 : volume"
                @input="setVolume($event.target.value)"
              />
            </div>

            <!-- 时间显示 -->
            <TimeDisplay :current-time="currentTime" :duration="duration" />
          </div>

          <!-- 右侧按钮组 -->
          <div class="controls-right">
            <!-- 全屏按钮 -->
            <button class="control-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
              <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 播放/暂停 大按钮（视频中显示） -->
      <transition name="fade">
        <div v-if="!isPlaying" class="play-overlay" @click="togglePlay">
          <div class="play-overlay-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.video-player-container {
  width: 100%;
  position: relative;
}

.video-player {
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player video {
  width: 100%;
  height: auto;
  display: block;
}

.video-player.is-fullscreen {
  border-radius: 0;
}

.video-player.is-fullscreen video {
  max-height: 100vh;
}

/* 控制栏 */
.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 10px 12px 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-player:hover .controls,
.video-player.is-fullscreen .controls {
  opacity: 1;
}

/* 进度条 */
.progress-container {
  position: relative;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.progress-buffered {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  pointer-events: none;
}

.progress-bar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: var(--accent);
  border-radius: 2px;
  pointer-events: none;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-container:hover .progress-handle {
  opacity: 1;
}

/* 控制按钮 */
.controls-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

/* 音量控制 */
.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-slider {
  width: 0;
  height: 4px;
  opacity: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  accent-color: var(--accent);
}

.volume-control:hover .volume-slider {
  width: 60px;
  opacity: 1;
}

/* 播放覆盖层 */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.play-overlay-icon {
  width: 64px;
  height: 64px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background 0.2s ease;
}

.play-overlay:hover .play-overlay-icon {
  transform: scale(1.1);
  background: rgba(0, 0, 0, 0.8);
}

.play-overlay-icon svg {
  width: 32px;
  height: 32px;
  color: #fff;
  margin-left: 4px;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
