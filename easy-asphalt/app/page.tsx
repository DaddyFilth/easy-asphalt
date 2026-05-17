'use client';

import { useState } from 'react';
import ImageUploadPanel from './components/ImageUploadPanel';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🛣️</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Easy Asphalt</h1>
          </div>
          <p className="text-slate-300">Driveway Estimator Pro</p>
        </div>

        {/* Main Content */}
        <div>
          {/* Image Upload */}
          <ImageUploadPanel
            onImageSelected={(file, preview) => {
              setSelectedImage({ file, preview });
            }}
          />

          {/* Selected Image Info */}
          {selectedImage && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                ✓ Image selected: <span className="font-medium">{selectedImage.file.name}</span>
              </p>
              <p className="text-blue-300 text-sm mt-1">
                Size: {(selectedImage.file.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
