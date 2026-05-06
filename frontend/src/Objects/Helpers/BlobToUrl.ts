export default function blobToUrl(blob: ArrayBuffer, mimeType = "text/plain"): string{ 
     return URL.createObjectURL(new Blob([blob], {type: mimeType})); 
}