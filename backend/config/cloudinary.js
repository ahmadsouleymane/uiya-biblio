import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv"

dotenv.config()

// Configuration via CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name)
// ou via les variables séparées CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.
// On parse explicitement CLOUDINARY_URL pour éviter que le SDK perde les
// credentials lors d'un cloudinary.config() ultérieur.
if (process.env.CLOUDINARY_URL) {
  try {
    const u = new URL(process.env.CLOUDINARY_URL)
    cloudinary.config({
      cloud_name: u.hostname,
      api_key: decodeURIComponent(u.username),
      api_secret: decodeURIComponent(u.password),
      secure: true,
    })
  } catch {
    cloudinary.config({ secure: true })
  }
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET))

// Upload d'un buffer (PDF) vers Cloudinary en resource_type "raw".
// On laisse Cloudinary générer un nom unique (use_filename + unique_filename)
// pour éviter les collisions entre fichiers de même nom.
export const uploadPdfBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "biblio/pdfs",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    )
    stream.end(buffer)
  })

export const destroyPdf = (publicId) =>
  cloudinary.uploader.destroy(publicId, { resource_type: "raw" })

export default cloudinary
