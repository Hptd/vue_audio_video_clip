import { ref } from 'vue'

/**
 * 视频缩略图生成 Composable
 * @returns {Object} 缩略图生成方法和状态
 */
export function useVideoThumbnail() {
  // 缩略图列表
  const thumbnails = ref([])
  // 是否正在生成
  const isGenerating = ref(false)
  // 生成进度 (0-100)
  const progress = ref(0)

  /**
   * 从视频文件生成缩略图
   * @param {File|Blob} videoFile - 视频文件
   * @param {number} count - 缩略图数量（默认 15-30 张）
   * @param {number} width - 缩略图宽度（默认 120px）
   * @param {number} height - 缩略图高度（默认 68px）
   * @returns {Promise<string[]>} 缩略图 DataURL 数组
   */
  async function generateThumbnails(
    videoFile,
    count = 20,
    width = 120,
    height = 68
  ) {
    isGenerating.value = true
    progress.value = 0
    thumbnails.value = []

    try {
      // 创建视频元素
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      
      const videoUrl = URL.createObjectURL(videoFile)
      
      // 等待视频元数据加载
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(videoUrl)
          resolve()
        }
        video.onerror = reject
        video.src = videoUrl
      })

      const duration = video.duration
      if (!duration || !isFinite(duration)) {
        throw new Error('无法获取视频时长')
      }

      // 计算采样间隔
      const interval = duration / count
      const generatedThumbnails = []

      // 创建 Canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      // 生成缩略图
      for (let i = 0; i < count; i++) {
        const time = i * interval
        
        // 跳转到指定时间
        video.currentTime = time
        await new Promise(resolve => {
          video.onseeked = resolve
        })

        // 绘制帧到 Canvas
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, width, height)
        
        // 保持视频比例绘制
        const videoRatio = video.videoWidth / video.videoHeight
        const canvasRatio = width / height
        
        let drawWidth, drawHeight, offsetX, offsetY
        
        if (videoRatio > canvasRatio) {
          drawHeight = height
          drawWidth = height * videoRatio
          offsetX = (width - drawWidth) / 2
          offsetY = 0
        } else {
          drawWidth = width
          drawHeight = width / videoRatio
          offsetX = 0
          offsetY = (height - drawHeight) / 2
        }
        
        ctx.drawImage(
          video,
          offsetX,
          offsetY,
          drawWidth,
          drawHeight
        )

        // 转换为 DataURL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        generatedThumbnails.push({
          time,
          url: dataUrl
        })

        // 更新进度
        progress.value = ((i + 1) / count) * 100
      }

      // 清理
      video.src = ''
      
      thumbnails.value = generatedThumbnails
      isGenerating.value = false
      
      return generatedThumbnails
    } catch (error) {
      console.error('生成缩略图失败:', error)
      isGenerating.value = false
      throw error
    }
  }

  /**
   * 从视频 URL 生成缩略图
   * @param {string} videoUrl - 视频 URL
   * @param {number} count - 缩略图数量
   * @param {number} width - 缩略图宽度
   * @param {number} height - 缩略图高度
   * @returns {Promise<string[]>} 缩略图 DataURL 数组
   */
  async function generateFromUrl(
    videoUrl,
    count = 20,
    width = 120,
    height = 68
  ) {
    isGenerating.value = true
    progress.value = 0
    thumbnails.value = []

    try {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = reject
        video.src = videoUrl
      })

      const duration = video.duration
      if (!duration || !isFinite(duration)) {
        throw new Error('无法获取视频时长')
      }

      const interval = duration / count
      const generatedThumbnails = []
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      for (let i = 0; i < count; i++) {
        const time = i * interval
        video.currentTime = time
        
        await new Promise(resolve => {
          video.onseeked = resolve
        })

        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, width, height)
        
        const videoRatio = video.videoWidth / video.videoHeight
        const canvasRatio = width / height
        
        let drawWidth, drawHeight, offsetX, offsetY
        
        if (videoRatio > canvasRatio) {
          drawHeight = height
          drawWidth = height * videoRatio
          offsetX = (width - drawWidth) / 2
          offsetY = 0
        } else {
          drawWidth = width
          drawHeight = width / videoRatio
          offsetX = 0
          offsetY = (height - drawHeight) / 2
        }
        
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        generatedThumbnails.push({
          time,
          url: dataUrl
        })

        progress.value = ((i + 1) / count) * 100
      }

      video.src = ''
      thumbnails.value = generatedThumbnails
      isGenerating.value = false
      
      return generatedThumbnails
    } catch (error) {
      console.error('生成缩略图失败:', error)
      isGenerating.value = false
      throw error
    }
  }

  /**
   * 清空缩略图
   */
  function clearThumbnails() {
    thumbnails.value = []
    progress.value = 0
    isGenerating.value = false
  }

  return {
    thumbnails,
    isGenerating,
    progress,
    generateThumbnails,
    generateFromUrl,
    clearThumbnails
  }
}
