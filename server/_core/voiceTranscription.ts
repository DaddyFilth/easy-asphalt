import { ENV } from "./env";

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type WhisperSegment = {
  id: number; seek: number; start: number; end: number;
  text: string; tokens: number[]; temperature: number;
  avg_logprob: number; compression_ratio: number; no_speech_prob: number;
};

export type WhisperResponse = {
  task: "transcribe"; language: string; duration: number;
  text: string; segments: WhisperSegment[];
};

export type TranscriptionResponse = WhisperResponse;

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "UPLOAD_FAILED" | "SERVICE_ERROR";
  details?: string;
};

export async function transcribeAudio(
  options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  if (!ENV.openAiApiKey) {
    return {
      error: "Voice transcription is not configured",
      code: "SERVICE_ERROR",
      details: "Set OPENAI_API_KEY to enable transcription",
    };
  }

  try {
    const audioResp = await fetch(options.audioUrl);
    if (!audioResp.ok) {
      return {
        error: "Failed to download audio file",
        code: "INVALID_FORMAT",
        details: `HTTP ${audioResp.status}`,
      };
    }

    const audioBuffer = await audioResp.arrayBuffer();
    const mimeType = audioResp.headers.get("content-type") || "audio/mpeg";
    const sizeMB = audioBuffer.byteLength / (1024 * 1024);
    if (sizeMB > 25) {
      return {
        error: "Audio file exceeds maximum size limit",
        code: "FILE_TOO_LARGE",
        details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is 25MB`,
      };
    }

    const formData = new FormData();
    const ext = mimeType.split("/").pop() || "mp3";
    formData.append("file", new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    if (options.language) formData.append("language", options.language);
    if (options.prompt) formData.append("prompt", options.prompt);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.openAiApiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Transcription failed",
        code: "TRANSCRIPTION_FAILED",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
      };
    }

    return (await response.json()) as WhisperResponse;
  } catch (error) {
    return {
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}


