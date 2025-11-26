// src/utils/resolveVideoSource.ts

export type ResolvedVideo = {
  type: "mp4" | "m3u8" | "youtube" | "vimeo" | "tubi" | "drive" | "web" | "unknown";
  playableUrl: string;
  embedUrl?: string;
  videoId?: string;
};

/**
 * Detects and resolves video source into proper player-friendly format.
 * Supports: MP4, M3U8, YouTube, Vimeo, Tubi, Archive.org, Google Drive.
 */
export function resolveVideoSource(inputUrl: string): ResolvedVideo {
  if (!inputUrl) {
    return { type: "unknown", playableUrl: "" };
  }

  const url = inputUrl.trim();

  // -----------------------
  // 1. DIRECT MP4 FILE
  // -----------------------
  if (url.endsWith(".mp4") || url.includes(".mp4?")) {
    return {
      type: "mp4",
      playableUrl: url,
    };
  }

  // -----------------------
  // 2. DIRECT HLS .m3u8 FILE
  // -----------------------
  if (url.includes(".m3u8")) {
    return {
      type: "m3u8",
      playableUrl: url,
    };
  }

  // -----------------------
  // 3. YOUTUBE
  // -----------------------
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = extractYouTubeID(url);
    if (!videoId) {
      return { type: "youtube", playableUrl: "", embedUrl: url };
    }

    return {
      type: "youtube",
      playableUrl: "",
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      videoId: videoId,
    };
  }

  // -----------------------
  // 4. VIMEO
  // -----------------------
  if (url.includes("vimeo.com")) {
    const vimeoId = extractVimeoID(url);
    return {
      type: "vimeo",
      playableUrl: "",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      videoId: vimeoId,
    };
  }

  // -----------------------
  // 5. TUBI
  // -----------------------
  if (url.includes("tubitv.com")) {
    return {
      type: "tubi",
      playableUrl: "",
      embedUrl: url,
    };
  }

  // -----------------------
  // 6. GOOGLE DRIVE (Public Files)
  // -----------------------
  if (url.includes("drive.google.com")) {
    const id = extractGoogleDriveID(url);
    if (id) {
      return {
        type: "drive",
        playableUrl: `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      };
    }
  }

  // -----------------------
  // 7. ARCHIVE.ORG (Auto-detect MP4 or stream)
  // -----------------------
  if (url.includes("archive.org")) {
    if (url.endsWith(".mp4")) {
      return { type: "mp4", playableUrl: url };
    }
    return { type: "web", playableUrl: "", embedUrl: url };
  }

  // -----------------------
  // 8. FALLBACK — open in WebView
  // -----------------------
  return {
    type: "web",
    playableUrl: "",
    embedUrl: url,
  };
}

/* ------------------------------------------------------
   YOUTUBE ID EXTRACTOR
------------------------------------------------------- */
function extractYouTubeID(url: string): string | null {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/* ------------------------------------------------------
   VIMEO ID EXTRACTOR
------------------------------------------------------- */
function extractVimeoID(url: string): string {
  const match = /vimeo\.com\/(\d+)/.exec(url);
  return match ? match[1] : "";
}

/* ------------------------------------------------------
   GOOGLE DRIVE ID EXTRACTOR
------------------------------------------------------- */
function extractGoogleDriveID(url: string): string | null {
  // Format: https://drive.google.com/file/d/FILEID/view
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  return match ? match[1] : null;
}
