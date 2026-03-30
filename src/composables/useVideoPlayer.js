import { ref, onMounted, onUnmounted, watch } from 'vue'

/**
 * 视频播放器控制逻辑
 * @param {import('vue').Ref<HTMLVideoElement|null>} videoRef - 视频元素引用
 * @returns {Object} 播放器控制方法和状态
 */
export function useVideoPlayer(videoRef) {
  // 播放状态
  const isPlaying = ref(false)
  // 当前时间
  const currentTime = ref(0)
  // 总时长
  const duration = ref(0)
  // 音量 (0-1)
  const volume = ref(1)
  // 是否静音
  const isMuted = ref(false)
  // 是否全屏
  const isFullscreen = ref(false)
  // 是否正在拖拽进度条
  const isSeeking = ref(false)
  // 缓冲进度 (0-100)
  const buffered = ref(0)

  /**
   * 格式化时间显示
   * @param {number} seconds - 秒数
   * @returns {string} MM:SS 格式
   */
  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '00:00'
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  /**
   * 切换播放/暂停
   */
  function togglePlay() {
    if (!videoRef.value) return
    
    if (isPlaying.value) {
      videoRef.value.pause()
    } else {
      videoRef.value.play()
    }
  }

  /**
   * 播放
   */
  function play() {
    if (!videoRef.value) return
    videoRef.value.play()
  }

  /**
   * 暂停
   */
  function pause() {
    if (!videoRef.value) return
    videoRef.value.pause()
  }

  /**
   * 跳转时间
   * @param {number} time - 目标时间（秒）
   */
  function seek(time) {
    if (!videoRef.value) return
    videoRef.value.currentTime = Math.max(0, Math.min(time, duration.value))
  }

  /**
   * 设置音量
   * @param {number} value - 音量值 (0-1)
   */
  function setVolume(value) {
    if (!videoRef.value) return
    
    volume.value = Math.max(0, Math.min(1, value))
    videoRef.value.volume = volume.value
    isMuted.value = volume.value === 0
  }

  /**
   * 切换静音
   */
  function toggleMute() {
    if (!videoRef.value) return
    
    if (isMuted.value) {
      videoRef.value.volume = volume.value || 0.5
      isMuted.value = false
    } else {
      videoRef.value.volume = 0
      isMuted.value = true
    }
  }

  /**
   * 切换全屏
   */
  async function toggleFullscreen() {
    const container = videoRef.value?.parentElement?.closest('.video-player-container')
    
    if (!container) return
    
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
        isFullscreen.value = true
      } else {
        await document.exitFullscreen()
        isFullscreen.value = false
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  /**
   * 处理时间更新
   */
  function onTimeUpdate() {
    if (!videoRef.value || isSeeking.value) return
    currentTime.value = videoRef.value.currentTime
  }

  /**
   * 处理时长加载
   */
  function onLoadedMetadata() {
    if (!videoRef.value) return
    duration.value = videoRef.value.duration
    volume.value = videoRef.value.volume
  }

  /**
   * 处理播放状态变化
   */
  function onPlay() {
    isPlaying.value = true
  }

  /**
   * 处理暂停状态变化
   */
  function onPause() {
    isPlaying.value = false
  }

  /**
   * 处理缓冲进度
   */
  function onProgress() {
    if (!videoRef.value || !videoRef.value.buffered.length) return
    
    const bufferedEnd = videoRef.value.buffered.end(videoRef.value.buffered.length - 1)
    buffered.value = (bufferedEnd / duration.value) * 100
  }

  /**
   * 处理全屏变化
   */
  function onFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement
  }

  /**
   * 处理视频结束
   */
  function onEnded() {
    isPlaying.value = false
  }

  // 监听全屏变化
  onMounted(() => {
    document.addEventListener('fullscreenchange', onFullscreenChange)
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
  })

  return {
    // 状态
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isSeeking,
    buffered,
    // 方法
    formatTime,
    togglePlay,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    onTimeUpdate,
    onLoadedMetadata,
    onPlay,
    onPause,
    onProgress,
    onEnded
  }
}
