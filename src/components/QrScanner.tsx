import { useRef, useState, useCallback, useEffect } from 'react'
import QrScannerLib from 'qr-scanner'
import { Camera, CameraOff, ArrowRight, Save, ScanLine, Upload } from 'lucide-react'

interface Props {
  onScanned: (text: string) => void
  onSaveToHistory: (text: string) => void
}

export default function QrScanner({ onScanned, onSaveToHistory }: Props) {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScannerLib | null>(null)

  const handleError = useCallback((raw: unknown) => {
    const msg = raw instanceof Error ? raw.message : String(raw)
    if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')) {
      setError(
        '카메라 권한이 차단되었습니다.\n\n' +
        '• iPhone(사파리): 설정 → 사파리 → 카메라 → 허용\n' +
        '• 안드로이드(크롬):\n' +
        '  1. 크롬 → 설정 → 사이트 설정 → 카메라\n' +
        '     → "helpring1004-wq.github.io" 찾아서 허용\n' +
        '  2. 또는 설정 → 애플리케이션 → Chrome\n' +
        '     → 권한 → 카메라 → 허용\n\n' +
        '자동으로 차단된 경우, 위 1번 방법으로 직접 허용하셔야 합니다.'
      )
    } else if (msg.includes('NotReadable') || msg.includes('busy') || msg.includes('in use')) {
      setError(
        '카메라를 사용할 수 없습니다.\n\n' +
        '원인 및 해결:\n' +
        '1. 크롬 인터넷 창(탭)을 모두 닫고 다시 시도하세요.\n' +
        '2. 다른 앱(카카오톡, 카메라, 영상통화 등)이 카메라를 쓰고 있지 않은지 확인하세요.\n' +
        '3. 위 방법으로 안 될 경우, 핸드폰을 재부팅한 뒤 다시 시도하세요.'
      )
    } else if (msg.includes('NotFound') || msg.includes('camera')) {
      setError('카메라를 찾을 수 없습니다.\n이 기기에 카메라가 있는지 확인해주세요.')
    } else {
      setError('카메라를 시작할 수 없습니다.\n원인: ' + msg)
    }
    setIsScanning(false)
  }, [])

  const startScan = useCallback(async () => {
    setError(null)
    setScanResult(null)
    setIsScanning(true)

    try {
      if (!videoRef.current) {
        setError('비디오 요소를 찾을 수 없습니다.')
        setIsScanning(false)
        return
      }
      const scanner = new QrScannerLib(
        videoRef.current,
        (result: string | QrScannerLib.ScanResult) => {
          const text = typeof result === 'string' ? result : result.data
          setScanResult(text)
          scanner.stop()
          setIsScanning(false)
        },
        {
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
        }
      )
      scannerRef.current = scanner
      await scanner.start()
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  const stopScan = useCallback(() => {
    const scanner = scannerRef.current
    if (!scanner) {
      setIsScanning(false)
      return
    }
    try {
      scanner.stop()
    } finally {
      scannerRef.current = null
      setIsScanning(false)
    }
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

  const handleFileScan = useCallback(async (file: File) => {
    setError(null)
    try {
      const result = await QrScannerLib.scanImage(file)
      setScanResult(result)
    } catch {
      setError('사진에서 QR 코드를 찾을 수 없습니다.\nQR이 잘 보이는 사진을 선택해주세요.')
    }
  }, [])

  useEffect(() => {
    return () => {
      scannerRef.current?.stop()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ScanLine size={22} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">QR 코드 스캔</h2>
        </div>

        <video
          ref={videoRef}
          className={`w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-gray-200 bg-black transition-all ${
            isScanning ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden border-0'
          }`}
          muted
          playsInline
        />

        {!isScanning && !scanResult && (
          <div className="text-center py-8 space-y-4">
            <p className="text-gray-500 text-sm">휴대폰이나 문서에 있는 QR 코드를 카메라로 스캔하거나 사진 업로드로 스캔합니다.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={startScan}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Camera size={20} />
                카메라 시작
              </button>
              <label className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer">
                <Upload size={20} />
                사진 업로드
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileScan(file)
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {isScanning && (
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <pre className="text-red-600 text-sm whitespace-pre-wrap font-sans">{error}</pre>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-sm text-red-700 underline block mx-auto"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
