import { useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, ArrowRight, Save, ScanLine } from 'lucide-react'

interface Props {
  onScanned: (text: string) => void
  onSaveToHistory: (text: string) => void
}

export default function QrScanner({ onScanned, onSaveToHistory }: Props) {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanReady, setScanReady] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const startScan = useCallback(async () => {
    setError(null)
    setScanResult(null)
    // 스캐너 초기화에 잠깐 말리기 위해 상태 먼저 트리거
    setIsScanning(true)
    setScanReady(false)

    requestAnimationFrame(async () => {
      setScanReady(true)
      // DOM 업데이트 보장 후 실행
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode('qr-reader')
          scannerRef.current = scanner
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              setScanResult(decodedText)
              scanner.stop().catch(() => {})
              setIsScanning(false)
            },
            () => {}
          )
        } catch {
          setError('카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.')
          setIsScanning(false)
        }
      }, 200)
    })
  }, [])

  const stopScan = useCallback(() => {
    const scanner = scannerRef.current
    if (!scanner) {
      setIsScanning(false)
      return
    }
    scanner.stop().then(() => {
      scanner.clear()
      scannerRef.current = null
      setIsScanning(false)
    }).catch(() => {
      scanner.clear()
      scannerRef.current = null
      setIsScanning(false)
    })
  }, [])

  const handleGenerate = useCallback(() => {
    if (scanResult) {
      onScanned(scanResult)
      setScanResult(null)
    }
  }, [scanResult, onScanned])

  const handleSave = useCallback(() => {
    if (scanResult) {
      onSaveToHistory(scanResult)
      setScanResult(null)
    }
  }, [scanResult, onSaveToHistory])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ScanLine size={22} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">QR 코드 스캔</h2>
        </div>

        {/* 이 div는 항상 렌더링돼야 함. id 기반으로 scanner가 찾음. */}
        <div
          id="qr-reader"
          className={`w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-gray-200 transition-all ${
            isScanning ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden border-0'
          }`}
        />

        {!isScanning && !scanResult && (
          <div className="text-center py-8 space-y-4">
            <p className="text-gray-500 text-sm">휴대폰이나 문서에 있는 QR 코드를 카메라로 스캔합니다.</p>
            <button
              onClick={startScan}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Camera size={20} />
              카메라 시작
            </button>
          </div>
        )}

        {isScanning && scanReady && (
          <div className="text-center">
            <button
              onClick={stopScan}
              className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              <CameraOff size={16} />
              중지
            </button>
          </div>
        )}

        {scanResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">스캔 결과</p>
              <p className="text-gray-900 break-all font-mono text-sm bg-white rounded-lg p-3 border border-green-100">
                {scanResult}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <ArrowRight size={16} />
                이 텍스트로 QR 생성
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm"
              >
                <Save size={16} />
                기록에 저장
              </button>
              <button
                onClick={() => { setScanResult(null); setTimeout(startScan, 150) }}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Camera size={16} />
                다시 스캔
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="mt-2 text-sm text-red-700 underline">닫기</button>
          </div>
        )}
      </div>
    </div>
  )
}
