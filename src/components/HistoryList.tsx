import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Trash2, Printer, Download } from 'lucide-react'

interface QrItem {
  id: string
  text: string
  size: number
  createdAt: number
}

interface Props {
  items: QrItem[]
  onDelete: (id: string) => void
  onClear: () => void
}

export default function HistoryList({ items, onDelete, onClear }: Props) {
  const [search, setSearch] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const filtered = items
    .filter((i) => i.text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt)

  const handlePrintOne = (item: QrItem) => {
    const win = window.open('', '_blank')
    if (!win) return
    const svg = document.getElementById(`hist-qr-${item.id}`)
    const svgHtml = svg ? svg.outerHTML : ''
    win.document.write(`
      <html>
        <head><title>QR 인쇄</title>
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
          .box { text-align: center; }
          p { margin-top: 12px; font-size: 14px; color: #555; word-break: break-all; max-width: 300px; }
        </style></head>
        <body>
          <div class="box">
            ${svgHtml}
            <p>${item.text}</p>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 300)
  }

  const handlePrintAll = () => {
    if (!filtered.length) return
    const win = window.open('', '_blank')
    if (!win) return
    let body = `<div style="display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;padding:2rem;">`
    filtered.forEach((item) => {
      const svg = document.getElementById(`hist-qr-${item.id}`)
      body += `
        <div style="text-align:center;">
          ${svg ? svg.outerHTML : ''}
          <p style="margin-top:8px;font-size:12px;color:#555;max-width:200px;word-break:break-all;">${item.text}</p>
        </div>
      `
    })
    body += `</div>`
    win.document.write(`
      <html>
        <head><title>QR 일괄 인쇄</title>
        <style>body{margin:0;font-family:sans-serif;}</style></head>
        <body>${body}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 400)
  }

  const handleDownload = (item: QrItem) => {
    const canvas = document.createElement('canvas')
    const svg = document.getElementById(`hist-qr-${item.id}`)
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const img = new Image()
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    img.onload = () => {
      canvas.width = item.size
      canvas.height = item.size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = pngUrl
      link.download = `qr-${item.text.slice(0, 20).replace(/\s/g, '_')}.png`
      link.click()
    }
    img.src = url
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">생성 기록 ({items.length}개)</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
          />
          {items.length > 0 && (
            <>
              <button
                onClick={handlePrintAll}
                className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-900 transition-colors"
                title="검색결과 전체 인쇄"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">인쇄</span>
              </button>
              <button
                onClick={onClear}
                className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                title="전체 삭제"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">삭제</span>
              </button>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
          기록이 없습니다.
        </div>
      ) : (
        <div ref={printRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow p-3 flex flex-col items-center gap-2 hover:shadow-md transition-shadow relative group"
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 no-print">
                <button
                  onClick={() => handlePrintOne(item)}
                  className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700"
                  title="인쇄"
                >
                  <Printer size={14} />
                </button>
                <button
                  onClick={() => handleDownload(item)}
                  className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-indigo-600"
                  title="PNG 다운로드"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 bg-gray-100 rounded-md hover:bg-red-100 text-red-600"
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <QRCodeSVG
                id={`hist-qr-${item.id}`}
                value={item.text}
                size={Math.min(item.size, 160)}
                includeMargin
              />
              <p className="text-xs text-gray-500 text-center break-all w-full px-2 mt-1">
                {item.text.length > 24 ? item.text.slice(0, 24) + '...' : item.text}
              </p>
              <p className="text-[10px] text-gray-400">
                {new Date(item.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
