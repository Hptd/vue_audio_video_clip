import { ref } from 'vue'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg']

/**
 * 媒体上传逻辑 Composable
 * @returns {Object} 上传相关文件和方法
 */
export function useMediaUpload() {
  // 已上传的文件列表
  const files = ref([])
  
  // 错误信息
  const error = ref(null)

  /**
   * 获取媒体文件时长
   * @param {File} file - 媒体文件
   * @returns {Promise<number>} 时长（秒）
   */
  function getMediaDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const media = document.createElement(file.type.startsWith('video') ? 'video' : 'audio')
      
      media.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(media.duration)
      }
      
      media.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(0)
      }
      
      media.src = url
    })
  }

  /**
   * 验证文件
   * @param {File} file - 待验证的文件
   * @returns {{ valid: boolean, error?: string }} 验证结果
   */
  function validateFile(file) {
    const fileType = file.type
    
    // 检查文件类型
    const isVideo = fileType.startsWith('video/')
    const isAudio = fileType.startsWith('audio/')
    
    if (!isVideo && !isAudio) {
      return {
        valid: false,
        error: `不支持的文件类型：${file.name}。请上传视频或音频文件。`
      }
    }
    
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `文件过大：${file.name}。文件大小为 ${(file.size / (1024 * 1024)).toFixed(2)}MB，最大支持 100MB。`
      }
    }
    
    return { valid: true }
  }

  /**
   * 获取文件类型分类
   * @param {string} mimeType - 文件 MIME 类型
   * @returns {'video' | 'audio'} 文件类型
   */
  function getFileType(mimeType) {
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'unknown'
  }

  /**
   * 生成唯一 ID
   * @returns {string} 唯一 ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 处理文件选择
   * @param {File[]} selectedFiles - 选中的文件列表
   */
  async function handleFileSelect(selectedFiles) {
    error.value = null
    
    for (const file of selectedFiles) {
      // 验证文件
      const validation = validateFile(file)
      if (!validation.valid) {
        console.warn(validation.error)
        // 这里可以选择是否显示错误提示
        continue
      }
      
      // 创建文件对象
      const fileData = {
        id: generateId(),
        file: file,
        url: URL.createObjectURL(file),
        type: getFileType(file.type),
        name: file.name,
        size: file.size,
        duration: 0,
        createdAt: new Date()
      }
      
      // 异步获取媒体时长
      getMediaDuration(file).then(duration => {
        const index = files.value.findIndex(f => f.id === fileData.id)
        if (index !== -1) {
          files.value[index].duration = duration
        }
      })
      
      files.value.push(fileData)
    }
  }

  /**
   * 删除文件
   * @param {string} fileId - 文件 ID
   */
  function removeFile(fileId) {
    const index = files.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      // 释放 URL 对象
      URL.revokeObjectURL(files.value[index].url)
      files.value.splice(index, 1)
    }
  }

  /**
   * 清空所有文件
   */
  function clearAllFiles() {
    files.value.forEach(f => URL.revokeObjectURL(f.url))
    files.value = []
  }

  return {
    files,
    error,
    handleFileSelect,
    removeFile,
    clearAllFiles
  }
}
