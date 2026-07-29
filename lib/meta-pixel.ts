/**
 * lib/meta-pixel.ts — Meta (Facebook) Pixel/Dataset ID за маркетинг сайта.
 *
 * Публичен ID (стои в браузъра). Ползва се и от браузър пиксела, и от CAPI сървъра,
 * за да е един източник на истината. Може да се override-не с NEXT_PUBLIC_META_PIXEL_ID.
 */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "1579340717259752";
