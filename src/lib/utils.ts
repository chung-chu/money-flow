import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeStringify(obj: any, replacer?: any, indent?: number): string {
  const cache = new Set();
  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            return '[Circular]';
          }
          if (
            value instanceof Window ||
            value.constructor?.name === 'Window' ||
            value.window === value ||
            value instanceof HTMLElement
          ) {
            return '[Window/Element]';
          }
          cache.add(value);
        }
        return replacer ? replacer(key, value) : value;
      },
      indent
    );
  } catch (err) {
    return '"[Unserializable]"';
  }
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
