/**
 * Compresses and center-crops any image URL or Data URL into a 16:9 high-quality JPEG Base64 string
 * using an HTML5 Canvas so exported WeChat rich text and standalone HTML stay lightweight and crisp.
 */
export async function compressImageTo16x9Jpeg(
  sourceUrl: string,
  options?: {
    targetWidth?: number;
    quality?: number;
    warmTintVariant?: number;
  }
): Promise<{ dataUrl: string; sizeKb: number }> {
  const targetWidth = options?.targetWidth ?? 1280;
  const targetHeight = Math.round((targetWidth * 9) / 16); // 720
  const quality = options?.quality ?? 0.84;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法初始化 Canvas 2D 上下文'));
          return;
        }

        // Fill warm paper background before drawing
        ctx.fillStyle = '#F7F5F0';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Calculate center-crop 16:9 source rectangle
        const srcRatio = img.width / img.height;
        const targetRatio = 16 / 9;

        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;

        if (srcRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else if (srcRatio < targetRatio) {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        // Optional subtle warm sunlight glaze when regenerating variants
        if (options?.warmTintVariant && options.warmTintVariant > 0) {
          const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
          grad.addColorStop(0, 'rgba(255, 248, 231, 0.08)');
          grad.addColorStop(1, 'rgba(245, 236, 218, 0.04)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const sizeKb = Math.max(1, Math.round((base64Length * 3) / 4 / 1024));
        resolve({ dataUrl, sizeKb });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('图片加载失败，无法执行 Canvas 压缩'));
    };

    img.src = sourceUrl;
  });
}

/**
 * Reads a local File object as a Data URL and compresses it into a 16:9 JPEG via Canvas.
 */
export async function compressLocalFileTo16x9Jpeg(
  file: File
): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawDataUrl = reader.result as string;
        const compressed = await compressImageTo16x9Jpeg(rawDataUrl, {
          targetWidth: 1280,
          quality: 0.85,
        });
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('读取本地图片文件失败'));
    reader.readAsDataURL(file);
  });
}
