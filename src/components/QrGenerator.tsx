import { useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Plus, Printer } from 'lucide-react'

interface QrItem {
  id: string
  text: string
  size: number
  createdAt: number
}

interface Props {
  onAdd: (item: QrItem) => void
}

export default function QrGenerator({ onAdd }: Props) {
  const [text, setText] = useState('')
  const [size, setSize] = useState(256)
  const [items, setItems] = useState<QrItem[]>([])

  const handleGenerate = useCallback(() => {
    if (!text.trim()) return
    const item: QrItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      size,
      createdAt: Date.now(),
    }
    setItems((prev) => [...prev, item])
    onAdd(item)
    setText('')
  }, [text, size, onAdd])

  const handlePrint = useCallback(() => {
    if (items.length === 0) return
    const win = window.open('', '_blank')
    if (!win) return
    let body = `<div style="display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;padding:2rem;">`
    items.forEach((item) => {
      const svg = document.getElementById(`qr-${item.id}`)
      const svgHtml = svg ? svg.outerHTML : ''
      body += `
        <div style="text-align:center;">
          ${svgHtml}
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
  }, [items])

  const handleDownload = useCallback((item: QrItem) => {
    const canvas = document.createElement('canvas')
    const svg = document.getElementById(`qr-${item.id}`)
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
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">QR 코드 생성</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">텍스트 / URL</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com 또는 텍스트 입력"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            크기: {size}px
          </label>
          <input
            type="range"
            min={128}
            max={512}
            step={16}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={18} />
            추가
          </button>
          <button
            onClick={handlePrint}
            disabled={items.length === 0}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Printer size={18} />
            인쇄 ({items.length})
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow p-3 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center gap-1">
                <QRCodeSVG
                  id={`qr-${item.id}`}
                  value={item.text}
                  size={item.size > 200 ? 200 : item.size}
                  includeMargin
                />
                <p className="text-xs text-gray-500 text-center break-all w-full px-2">
                  {item.text.length > 30 ? item.text.slice(0, 30) + '...' : item.text}
                </p>
              </div>
              <button
                onClick={() => handleDownload(item)}
                className="text-indigo-600 hover:text-indigo-800 no-print"
                title="PNG 다운로드"
              >
                <Download size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
