'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
}

export default function UploadZone({ onFilesSelected }: UploadZoneProps) {
  const onDrop = useCallback(acceptedFiles => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf')
    onFilesSelected(pdfFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  })

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <div className="text-3xl mb-2">📄</div>
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Solte os PDFs aqui...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium">Arraste PDFs aqui ou clique</p>
            <p className="text-sm text-gray-500 mt-1">Suporta PGDAS, Folha de Pagamento, Impostos</p>
          </>
        )}
      </div>
    </div>
  )
}
