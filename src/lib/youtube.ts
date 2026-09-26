/**
 * Utility for parsing and formatting YouTube embed URLs for AngusShop.
 */

export interface ParsedYoutube {
  videoId: string;
  startTime: number;
  embedUrl: string;
  thumbnailUrl: string;
}

export const POPULAR_MUSIC_PRESETS = [
  {
    title: 'YAWIP.N - อยู่โบแล๊ะ (Official MV)',
    videoId: 'SAKOqeeRpj4',
    startTime: 27,
    url: 'https://www.youtube.com/watch?v=SAKOqeeRpj4&t=27s'
  },
  {
    title: 'AngusShop Official Beat (0:27)',
    videoId: 'SAKOqeeRpj4',
    startTime: 27,
    url: 'https://www.youtube.com/embed/SAKOqeeRpj4?si=aiE7k-hMCtDUt8bA&start=27'
  },
  {
    title: 'Blox Fruits Anime Epic Remix',
    videoId: 'kJQP7kiw5Fk',
    startTime: 0,
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
  },
  {
    title: 'Gaming Chill Trap Beat (Lofi / Hip-Hop)',
    videoId: 'jfKfPfyJRdk',
    startTime: 0,
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
  },
  {
    title: 'Blox Fruits Sea 3 Epic Battle Theme',
    videoId: 'rQ3tI0FmG6M',
    startTime: 0,
    url: 'https://www.youtube.com/watch?v=rQ3tI0FmG6M'
  },
  {
    title: 'Phonk Gaming DRIFT Beats',
    videoId: 'h8qfT-N0m9o',
    startTime: 0,
    url: 'https://www.youtube.com/watch?v=h8qfT-N0m9o'
  }
];

export const parseYoutubeUrl = (
  input: string | undefined | null,
  overrideStartTime?: number,
  autoplay = true
): ParsedYoutube => {
  let videoId = 'SAKOqeeRpj4';
  let startTime = typeof overrideStartTime === 'number' ? overrideStartTime : 27;

  if (input && typeof input === 'string') {
    const trimmed = input.trim();

    // Check if start time is specified in the URL (e.g. t=27, start=27, t=1m20s)
    const timeMatch = trimmed.match(/[?&](?:start|t)=(\d+)/);
    if (timeMatch && timeMatch[1] && overrideStartTime === undefined) {
      startTime = parseInt(timeMatch[1], 10);
    }

    if (trimmed.includes('youtu.be/')) {
      const parts = trimmed.split('youtu.be/')[1].split(/[?&#]/);
      if (parts[0]) videoId = parts[0];
    } else if (trimmed.includes('/embed/')) {
      const parts = trimmed.split('/embed/')[1].split(/[?&#]/);
      if (parts[0]) videoId = parts[0];
    } else if (trimmed.includes('watch?v=') || trimmed.includes('&v=')) {
      const match = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) videoId = match[1];
    } else if (trimmed.includes('/shorts/')) {
      const parts = trimmed.split('/shorts/')[1].split(/[?&#]/);
      if (parts[0]) videoId = parts[0];
    } else if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      videoId = trimmed;
    }
  }

  const autoplayParam = autoplay ? '&autoplay=1' : '';
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&loop=1&playlist=${videoId}&start=${startTime}${autoplayParam}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return {
    videoId,
    startTime,
    embedUrl,
    thumbnailUrl
  };
};
