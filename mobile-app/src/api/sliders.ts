import { config } from '../config';

export interface SliderItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  image_url_mobile?: string;
  image_alt?: string;
  button_text?: string;
  button_url?: string;
  position: number;
  is_active: boolean;
  placement?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Fetch active sliders for the mobile app.
 * Prefer placement mobile_app_home, then home_page_hero; API may return image_url_mobile for platform=mobile.
 */
export async function getActiveSliders(placement?: string): Promise<SliderItem[]> {
  const params = new URLSearchParams();
  if (placement) params.set('placement', placement);
  params.set('platform', 'mobile');
  const url = `${config.apiBase}/sliders/active?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Sliders API error: ${res.status}`);
  }
  const data = await res.json();
  const list = data?.data ?? data?.sliders ?? data;
  return Array.isArray(list) ? list : [];
}
