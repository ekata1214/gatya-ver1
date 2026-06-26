const ROOT = './';

export const ASSETS = {
  cards: [
    `${ROOT}blue card.png`,
    `${ROOT}red card.png`,
    `${ROOT}green card.png`,
    `${ROOT}silver card.png`,
    `${ROOT}gold card.png`,
    `${ROOT}rainbow card.png`,
  ],
  ssrCard: `${ROOT}ssr card.png`,
  telop: `${ROOT}Gemini_Generated_Image_56rdkr56rdkr56rd.png`,
  fireVideo: `${ROOT}re fire.mp4`,
  ssrVideo: `${ROOT}white ssr.mp4`,
  kiseki1: `${ROOT}card kiseki1.mov`,
  kiseki2: `${ROOT}card kiseki2.mov`,
  ssrCircle: `${ROOT}ssr card circle.mov`,
  ink1: `${ROOT}ink1.mov`,
  count: `${ROOT}count.mov`,
};

export async function preloadImages(urls) {
  const out = {};
  await Promise.all(urls.map(async (url) => {
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      out[url] = img;
    } catch {
      console.warn(`[assets] image load failed: ${url}`);
      out[url] = null;
    }
  }));
  return out;
}
