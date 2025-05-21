import path from 'path';
import fs from 'fs';
import express from 'express';
import { nanoid } from 'nanoid';
import type { Express, Request, Response } from 'express';
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export function registerUploadRoutes(app: Express) {
  // Ensure uploads directory exists (optional, for legacy support)
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Make the uploads directory accessible (optional, for legacy support)
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    next();
  }, express.static(path.join(process.cwd(), 'public/uploads')));

  // Only keep the ImageKit authentication endpoint
  app.get("/api/imagekit-auth", (req: Request, res: Response) => {
    const result = imagekit.getAuthenticationParameters();
    res.json(result);
  });
}