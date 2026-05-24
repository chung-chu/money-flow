import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVND(num: number): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0 đ';
  }
  const formatted = new Intl.NumberFormat('vi-VN').format(num);
  return `${formatted} đ`;
}

export function formatShortVND(num: number): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0 đ';
  }
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace('.', ',') + ' tỷ đ';
  }
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.', ',') + ' triệu đ';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(0) + 'K đ';
  }
  return num + ' đ';
}
