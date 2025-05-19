import path from 'path';
import fs from 'fs';
import multer from 'multer';
import express from 'express';
import { nanoid } from 'nanoid';
import type { Express, Request, Response } from 'express';

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = nanoid(10);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Create upload middleware
export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create endpoint handler for uploads
export function registerUploadRoutes(app: Express) {
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Make the uploads directory accessible
  app.use('/uploads', (req, res, next) => {
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    next();
  }, express.static(path.join(process.cwd(), 'public/uploads')));

  // Image upload endpoint
  app.post('/api/upload/image', upload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }
      
      // Return the URL of the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      return res.status(200).json({ imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
  });
}