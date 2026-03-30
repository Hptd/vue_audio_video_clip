<script setup>
defineProps({
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  }
})

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
</script>

<template>
  <div class="time-display">
    <span class="current-time">{{ formatTime(currentTime) }}</span>
    <span class="separator">/</span>
    <span class="total-time">{{ formatTime(duration) }}</span>
  </div>
</template>

<style scoped>
.time-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #fff;
  font-family: var(--mono);
}

.separator {
  color: rgba(255, 255, 255, 0.5);
}
</style>
