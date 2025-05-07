/**
 * 日期时间工具函数
 */

/**
 * 格式化日期时间为更易读的形式
 * 
 * @param dateString ISO格式的日期字符串
 * @param includeTime 是否包含时间部分
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateString?: string, includeTime: boolean = true): string {
  if (!dateString) {
    return '-';
  }
  
  try {
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    // 格式化日期部分：YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateFormatted = `${year}-${month}-${day}`;
    
    // 如果不需要时间部分，直接返回日期
    if (!includeTime) {
      return dateFormatted;
    }
    
    // 格式化时间部分：HH:MM:SS
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const timeFormatted = `${hours}:${minutes}:${seconds}`;
    
    // 返回完整格式
    return `${dateFormatted} ${timeFormatted}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
} 