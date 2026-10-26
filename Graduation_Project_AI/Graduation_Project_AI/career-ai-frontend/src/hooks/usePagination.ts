import { useState, useCallback, useEffect } from 'react'
import type { UsePaginationResult } from '../types'

/**
 * A custom hook for handling pagination logic
 * @param fetchData Function to fetch data for a given page
 * @param initialLimit Initial number of items per page
 * @returns Pagination state and controls
 */
export function usePagination<T>(
  fetchData: (page: number, limit: number) => Promise<{ results: T[]; total: number }>,
  initialLimit: number = 10
): UsePaginationResult<T> {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(initialLimit)

  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrevious = page > 1

  const fetchPage = useCallback(async (pageNumber: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchData(pageNumber, limit)
      setData(response.results)
      setTotal(response.total)
      setPage(pageNumber)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchData, limit])

  const nextPage = useCallback(() => {
    if (hasNext) {
      fetchPage(page + 1)
    }
  }, [hasNext, page, fetchPage])

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      fetchPage(page - 1)
    }
  }, [hasPrevious, page, fetchPage])

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      fetchPage(pageNumber)
    }
  }, [totalPages, fetchPage])

  const refresh = useCallback(() => {
    fetchPage(page)
  }, [page, fetchPage])

  // Fetch initial data
  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  return {
    data,
    isLoading,
    error,
    page,
    totalPages,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
    goToPage,
    refresh,
  }
}
