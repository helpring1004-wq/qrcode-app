import { useState, useCallback } from 'react'
import { QrCode, ScanLine } from 'lucide-react'
import QrGenerator from './components/QrGenerator'
import QrScanner from './components/QrScanner'
import HistoryList from './components/HistoryList'
import { useLocalStorage } from './hooks/useLocalStorage'

interface QrItem {
  id: string
  text: string
  size: number
  createdAt: number
}

export default function App() {
  const [history, setHistory] = useLocalStorage<QrItem[]>('qr-history', [])
  const [tab, setTab] = useState<'generate' | 'scan' | 'history'>('generate')

  const handleAdd = useCallback((item: QrItem) => {
    setHistory((prev) => [item, ...prev])
  }, [setHistory])

  const handleDelete = useCallback((id: string) => {
    setHistory((prev) => prev.filter((i) => i.id !== id))
  }, [setHistory])

  const handleClear = useCallback(() => {
    if (confirm('모든 기록을 삭제하시겠습니까?')) {
      setHistory([])
    }
  }, [setHistory])

  const handleScanned = useCallback((_text: string) => {
    setTab('generate')
  }, [])

  const handleSaveToHistory = useCallback(
    (text: string) => {
      const item: QrItem = {
        id: crypto.randomUUID(),
        text,
        size: 256,
        createdAt: Date.now(),
      }
      setHistory((prev) => [item, ...prev])
      setTab('history')
    },
    [setHistory]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <QrCode size={28} className="text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">QR 코드 생성기</h1>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab('generate')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === 'generate'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                생성
              </button>
              <button
                onClick={() => setTab('scan')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  tab === 'scan'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ScanLine size={14} />
                스캔
              </button>
              <button
                onClick={() => setTab('history')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === 'history'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                기록 {history.length > 0 && `(${history.length})`}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === 'generate' && <QrGenerator onAdd={handleAdd} />}
        {tab === 'scan' && (
          <QrScanner
            onScanned={handleScanned}
            onSaveToHistory={handleSaveToHistory}
          />
        )}
        {tab === 'history' && (
          <HistoryList
            items={history}
            onDelete={handleDelete}
            onClear={handleClear}
          />
        )}
      </main>
    </div>
  )
}
