/// <reference types="vite/client" />

type ShellStatus = {
  state: "starting" | "ready" | "failed" | "exited" | string;
  message: string;
  detail: string;
};

type ShellState = {
  appMode: "app-shell" | "legacy-webui-dev" | string;
  backendUrl: string;
  mainPort: number;
  projectDir: string;
  outLogPath: string;
  errLogPath: string;
  status: ShellStatus;
};

type AppVoice = {
  id: string;
  display_name: string;
  tags: string[];
  notes: string;
  source: string;
  audio_path: string;
  audio_sha256: string;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  deleted_at: string | null;
};

type AppGeneration = {
  id: string;
  input_text: string;
  control_instruction: string;
  voice_id: string | null;
  reference_audio_path: string | null;
  prompt_text: string;
  cfg_value: number;
  inference_timesteps: number;
  normalize: boolean;
  denoise: boolean;
  output_audio_path: string | null;
  sample_rate: number | null;
  status: string;
  error_summary: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type AppListResponse<T> = {
  items: T[];
};

interface Window {
  voxcpmShell?: {
    onStatus(callback: (payload: ShellStatus) => void): void;
    getShellState(): Promise<ShellState>;
    listVoices(payload?: { include_deleted?: boolean }): Promise<AppListResponse<AppVoice>>;
    createVoice(payload: {
      source_audio_path: string;
      display_name: string;
      tags?: string[];
      notes?: string;
      source?: string;
      duration_seconds?: number | null;
    }): Promise<AppVoice>;
    updateVoice(payload: { id: string; display_name: string; tags: string[]; notes: string }): Promise<AppVoice>;
    deleteVoice(payload: { id: string }): Promise<AppVoice>;
    listGenerations(payload?: { include_deleted?: boolean }): Promise<AppListResponse<AppGeneration>>;
    createGeneration(payload: {
      input_text: string;
      control_instruction?: string;
      voice_id?: string | null;
      reference_audio_path?: string | null;
      prompt_text?: string;
      cfg_value?: number;
      inference_timesteps?: number;
      normalize?: boolean;
      denoise?: boolean;
    }): Promise<AppGeneration>;
    markGenerationRunning(payload: { id: string }): Promise<AppGeneration>;
    markGenerationSucceeded(payload: {
      id: string;
      source_output_audio_path: string;
      sample_rate: number;
    }): Promise<AppGeneration>;
    markGenerationFailed(payload: { id: string; error_summary?: string }): Promise<AppGeneration>;
    deleteGeneration(payload: { id: string }): Promise<AppGeneration>;
  };
}
