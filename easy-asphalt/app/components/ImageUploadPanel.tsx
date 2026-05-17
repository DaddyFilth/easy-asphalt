'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadPanelProps {
  onImageSelected?: (file: File, preview: string) => void;
}

export default function ImageUploadPanel({ onImageSelected }: ImageUploadPanelProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setFileName(file.name);
      onImageSelected?.(file, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleGeneratePreview = async () => {
    if (!preview) return;
    setIsGenerating(true);
    try {
      // Simulate AI generation - in production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Preview generation would happen here
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-lg font-semibold text-white">Driveway Photo</h2>
        <p className="text-sm text-slate-400 mt-1">Upload or drag a driveway image</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {!preview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-slate-400 mb-3" />
            <p className="text-white font-medium text-center">
              {isDragging ? 'Drop image here' : 'Drag image or click to upload'}
            </p>
            <p className="text-sm text-slate-400 mt-2">JPG, PNG, or WebP (max 10MB)</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Preview */}
            <div className="flex-1 mb-4 rounded-lg overflow-hidden bg-black">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>

            {/* File Info */}
            <div className="text-sm text-slate-300 mb-4">
              <p className="font-medium">File: {fileName}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleGeneratePreview}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Generate Preview
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    </div>
  );
}
