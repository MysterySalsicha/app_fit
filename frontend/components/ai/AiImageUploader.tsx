'use client'

import { useState, useRef, useCallback } from 'react'

interface AiImageUploaderProps {
  onCapture: (base64: string, mimeType: string) => void
  isLoading?: boolean
  accept?: string
}

export function AiImageUploader({ onCapture, isLoading, accept = 'image/*' }: AiImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      // Remove o prefixo "data:image/jpeg;base64,"
      const [header, base64] = dataUrl.split(',')
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      onCapture(base64, mimeType)
    }
    reader.readAsDataURL(file)
  }, [onCapture])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="hunter-card border-dashed border-primary/40 flex flex-col items-center justify-center py-8 gap-3 cursor-pointer hover:border-primary/70 transition-colors"
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Analisando com IA...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            <p className="text-xs text-muted-foreground text-center mt-2">Toque para trocar</p>
          </div>
        ) : (
          <>
            <p className="text-4xl">📸</p>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Tire uma foto ou selecione</p>
              <p className="text-xs text-muted-foreground mt-0.5">Arraste e solte ou toque aqui</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleInput}
        className="hidden"
      />
    </div>
  )
}
