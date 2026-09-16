# Opportunity uploads

The business wizard previously embedded base64 image and video files in the opportunity JSON body. Large bodies could be rejected by the reverse proxy with an HTML 413 response, which the UI then tried to parse as JSON.

Images now resize to at most 1600 pixels on their longest side and compress to JPEG at no more than 700 KiB. Each image uploads separately to `/api/business/media` with a 750 KiB server request limit and signature validation. The form submits the returned URLs. Uploaded marketing images are public through `/api/public/media/:id`; private document assets remain inaccessible through that route. Videos use hosted URLs rather than embedding video bytes in the JSON request. HTML proxy errors now produce a readable message and preserve form state.

The existing S3 storage configuration or an absolute, persistent `HOT_DEALS_PRIVATE_STORAGE_DIR` is required on the server. Local storage must be shared across instances or use S3 when running on multiple hosts. No new environment variable is required. Ensure the reverse proxy allows at least 1 MiB for `/api/business/media`. A smaller existing limit must be adjusted there; no blanket unlimited body size is needed. Deploy the frontend and backend together, rebuild and restart PM2.

Self-hosted deployments no longer inject Vercel Analytics. Browser-extension `contentscript.js` warnings are separate from the application submission failure. The PWA `beforeinstallprompt` console message is not a failed opportunity request.
