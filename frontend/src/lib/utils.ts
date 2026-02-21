import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

export function formatPercent(num: number): string {
  return `${(num * 100).toFixed(1)}%`
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    case 'medium':
      return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30'
    case 'low':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30'
  }
}

export function getSourceColor(source: string): string {
  switch (source) {
    case 'custom_pipeline':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
    case 'llm_rewrite':
      return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30'
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30'
  }
}
