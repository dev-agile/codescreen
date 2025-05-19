import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (imageUrl: string) => void;
  currentImageUrl?: string;
  label?: string;
}

export function FileUpload({ 
  onUploadComplete, 
  currentImageUrl, 
  label = "Upload Image" 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    
    try {
      // Create a preview URL
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      
      // Upload the file
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // Call the callback with the uploaded image URL
      onUploadComplete(data.imageUrl);
    } catch (err) {
      setError('Error uploading image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleClearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('');
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-col items-center">
        {previewUrl ? (
          <div className="relative mb-4 w-full max-w-md">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-auto rounded-md border"
              onError={() => {
                setError('Failed to load image preview');
                setPreviewUrl(null);
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleClearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="mb-4 border-2 border-dashed rounded-md p-8 w-full flex flex-col items-center justify-center text-gray-500 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={handleButtonClick}
          >
            <ImageIcon className="h-12 w-12 mb-2" />
            <p className="mb-1 font-medium">{label}</p>
            <p className="text-xs text-gray-500">JPG, PNG, GIF up to 5MB</p>
          </div>
        )}
        
        {error && (
          <p className="text-sm text-red-500 mb-2">{error}</p>
        )}
        
        <div className="flex justify-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          {!previewUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={isUploading}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Select Image'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}