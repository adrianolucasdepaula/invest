import { useState, useEffect, useRef } from 'react'
import { Search, TrendingUp } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

interface AssetSearchProps {
  onSelect: (ticker: string) => void
}

export default function AssetSearch({ onSelect }: AssetSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchAssets(debouncedQuery)
    } else {
      setResults([])
    }
  }, [debouncedQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAssets = async (searchQuery: string) => {
    setLoading(true)
    try {
      // TODO: Implementar chamada real à API
      // const response = await fetch(`/api/v1/assets/search?q=${searchQuery}`)
      // const data = await response.json()

      // Mock data por enquanto
      const mockResults = [
        { ticker: 'PETR4', name: 'Petrobras', type: 'Ação', sector: 'Petróleo' },
        { ticker: 'VALE3', name: 'Vale', type: 'Ação', sector: 'Mineração' },
        { ticker: 'ITUB4', name: 'Itaú Unibanco', type: 'Ação', sector: 'Bancário' },
      ].filter(item =>
        item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )

      setResults(mockResults)
      setIsOpen(true)
    } catch (error) {
      console.error('Error searching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (ticker: string) => {
    setQuery(ticker)
    setIsOpen(false)
    onSelect(ticker)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Buscar ativo (ex: PETR4, Vale3...)"
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-slide-in">
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelect(result.ticker)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {result.ticker}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {result.name}
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {result.sector}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}
