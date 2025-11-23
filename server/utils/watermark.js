import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createWatermarkedPreview(originalFilename) {
  try {
    const uploadsPath = path.join(__dirname, '../uploads');
    const inputPath = path.join(uploadsPath, originalFilename);
    const watermarkedFilename = originalFilename.replace('original-', 'preview-');
    const outputPath = path.join(uploadsPath, watermarkedFilename);

    console.log('Processing image:', originalFilename);

    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log('Image metadata:', metadata);

    // First resize the image
    const resizedImage = await image
      .resize(1920, null, { withoutEnlargement: true, fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    console.log('Resized dimensions:', resizedImage.info.width, 'x', resizedImage.info.height);

    // Now create watermark based on RESIZED dimensions
    const watermarkWidth = resizedImage.info.width;
    const watermarkHeight = resizedImage.info.height;
    const fontSize = Math.floor(Math.min(watermarkWidth, watermarkHeight) / 15);
    const watermarkText = "DA'PERFECT STUDIOS";

    const svgWatermark = `<svg width="${watermarkWidth}" height="${watermarkHeight}">
      <text x="50%" y="50%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}"
        font-weight="bold" fill="#FFD700" fill-opacity="0.4"
        transform="rotate(-35 ${watermarkWidth/2} ${watermarkHeight/2})">${watermarkText}</text>
    </svg>`;

    // Apply watermark to the resized image
    await sharp(resizedImage.data)
      .composite([{ 
        input: Buffer.from(svgWatermark), 
        gravity: 'center' 
      }])
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    console.log('✅ Watermarked image created:', watermarkedFilename);
    return watermarkedFilename;
  } catch (err) {
    console.error('❌ Watermark error:', err);
    // Return original filename if watermarking fails
    return originalFilename;
  }
}