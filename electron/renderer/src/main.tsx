import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AudioWaveform,
  Download,
  FileAudio,
  History,
  Languages,
  Library,
  Mic2,
  MoreHorizontal,
  Play,
  RefreshCw,
  Save,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  WandSparkles,
} from "lucide-react";
import "./styles.css";

type PageKey = "design" | "clone" | "ultimate" | "loraTraining" | "loraInference" | "library" | "history" | "settings";
type LanguageCode = "en" | "zh";
type AppDataState = "idle" | "loading" | "ready" | "failed";
type FeatureMode = "voice-design" | "voice-cloning" | "ultimate-cloning" | "lora-training" | "lora-inference";
type ReferenceKind = "none" | "upload" | "saved_voice";
type NavItem = {
  key: PageKey;
  labelKey: MessageKey;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const messages = {
  en: {
    appTitle: "VoxCPM Desktop",
    navDesign: "Voice Design",
    navClone: "Voice Cloning",
    navUltimate: "Ultimate Cloning",
    navLoraTraining: "LoRA Training",
    navLoraInference: "LoRA Inference",
    navLibrary: "Voice Library",
    navHistory: "History",
    navSettings: "Settings",
    appReady: "AppShell ready",
    starting: "Starting VoxCPM AppShell",
    designDescription: "Create a voice from text and a control prompt.",
    cloneDescription: "Generate with an uploaded clip or a saved voice.",
    ultimateDescription: "Use reference audio and transcript text.",
    loraTrainingDescription: "LoRA training is reserved for a later phase.",
    loraInferenceDescription: "LoRA inference is reserved for a later phase.",
    generate: "Generate",
    saveVoice: "Save Voice",
    saveGeneratedVoice: "Save Generated Voice",
    saveUploadedVoice: "Save Uploaded Voice",
    language: "Language",
    model: "Model",
    auto: "Auto",
    english: "English",
    chinese: "Chinese",
    controlInstruction: "Control Instruction",
    targetText: "Target Text",
    generationOutput: "Generation Output",
    noGeneration: "No generated audio yet",
    loadFailed: "Could not load app data",
    loadingData: "Loading app data",
    noSavedVoices: "No saved voices",
    noHistoryItems: "No generation history",
    retry: "Retry",
    pretrainedModel: "Pretrained Model",
    trainingManifest: "Training Manifest",
    loraCheckpoint: "LoRA Checkpoint",
    outputDirectory: "Output Directory",
    importVoice: "Import Voice",
    createVoice: "Create Voice",
    download: "Download",
    edit: "Edit",
    more: "More",
    favorite: "Favorite",
    endReached: "You've reached the end",
    runtime: "Runtime",
    backend: "Backend",
    appMode: "App mode",
    port: "Port",
    gradioRoute: "Gradio route",
    gradioRouteValue: "Use start_voxcpm.bat for the original WebUI.",
    localPaths: "Local Paths",
    project: "Project",
    outputLog: "Output log",
    errorLog: "Error log",
    appBackend: "App backend",
    legacyBackend: "Legacy backend",
    interface: "Interface",
    interfaceLanguage: "Interface language",
    languageHint: "Switches AppShell text only.",
    referenceSource: "Reference Source",
    noReference: "No Reference",
    uploadedAudio: "Uploaded Audio",
    savedVoice: "Saved Voice",
    selectAudio: "Select Audio",
    selectedAudio: "Selected audio",
    voiceName: "Voice Name",
    tags: "Tags",
    notes: "Notes",
    cfgValue: "CFG",
    steps: "Steps",
    normalize: "Normalize Text",
    denoise: "Denoise Reference",
    promptTranscript: "Reference Transcript",
    missingReference: "Select or upload a reference audio first.",
    generatedVoiceName: "Generated Voice",
    saveSuccess: "Saved to voice library.",
    noOutput: "No output audio",
    sampleRate: "Sample rate",
    status: "Status",
  },
  zh: {
    appTitle: "VoxCPM 桌面应用",
    navDesign: "声音设计",
    navClone: "声音克隆",
    navUltimate: "极致克隆",
    navLoraTraining: "LoRA 微调",
    navLoraInference: "LoRA 推理",
    navLibrary: "音色库",
    navHistory: "历史记录",
    navSettings: "设置",
    appReady: "AppShell 已就绪",
    starting: "正在启动 VoxCPM AppShell",
    designDescription: "用文本和控制提示创建声音。",
    cloneDescription: "使用上传音频或已存音色生成。",
    ultimateDescription: "使用参考音频和转写文本。",
    loraTrainingDescription: "LoRA 训练将在后续阶段接入。",
    loraInferenceDescription: "LoRA 推理将在后续阶段接入。",
    generate: "生成",
    saveVoice: "保存音色",
    saveGeneratedVoice: "保存生成音色",
    saveUploadedVoice: "保存上传音色",
    language: "语言",
    model: "模型",
    auto: "自动",
    english: "英语",
    chinese: "中文",
    controlInstruction: "控制提示",
    targetText: "目标文本",
    generationOutput: "生成结果",
    noGeneration: "暂无生成音频",
    loadFailed: "无法加载应用数据",
    loadingData: "正在加载应用数据",
    noSavedVoices: "暂无已保存音色",
    noHistoryItems: "暂无生成历史",
    retry: "重试",
    pretrainedModel: "预训练模型",
    trainingManifest: "训练清单",
    loraCheckpoint: "LoRA 检查点",
    outputDirectory: "输出目录",
    importVoice: "导入音色",
    createVoice: "创建音色",
    download: "下载",
    edit: "编辑",
    more: "更多",
    favorite: "收藏",
    endReached: "已经到底",
    runtime: "运行状态",
    backend: "后端",
    appMode: "应用模式",
    port: "端口",
    gradioRoute: "Gradio 入口",
    gradioRouteValue: "使用 start_voxcpm.bat 启动原始 WebUI。",
    localPaths: "本地路径",
    project: "项目",
    outputLog: "输出日志",
    errorLog: "错误日志",
    appBackend: "应用后端",
    legacyBackend: "旧版后端",
    interface: "界面",
    interfaceLanguage: "界面语言",
    languageHint: "仅切换 AppShell 文案。",
    referenceSource: "参考来源",
    noReference: "无参考",
    uploadedAudio: "上传音频",
    savedVoice: "已存音色",
    selectAudio: "选择音频",
    selectedAudio: "已选择音频",
    voiceName: "音色名称",
    tags: "标签",
    notes: "备注",
    cfgValue: "CFG",
    steps: "步数",
    normalize: "文本规范化",
    denoise: "参考音频降噪",
    promptTranscript: "参考音频转写",
    missingReference: "请先选择或上传参考音频。",
    generatedVoiceName: "生成音色",
    saveSuccess: "已保存到音色库。",
    noOutput: "无输出音频",
    sampleRate: "采样率",
    status: "状态",
  },
} as const;

type MessageKey = keyof typeof messages.en;

const navItems: NavItem[] = [
  { key: "design", labelKey: "navDesign", icon: WandSparkles },
  { key: "clone", labelKey: "navClone", icon: Mic2 },
  { key: "ultimate", labelKey: "navUltimate", icon: AudioWaveform },
  { key: "loraTraining", labelKey: "navLoraTraining", icon: SlidersHorizontal },
  { key: "loraInference", labelKey: "navLoraInference", icon: FileAudio },
  { key: "library", labelKey: "navLibrary", icon: Library },
  { key: "history", labelKey: "navHistory", icon: History },
  { key: "settings", labelKey: "navSettings", icon: Settings },
];

function App() {
  const [activePage, setActivePage] = useState<PageKey>("design");
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = window.localStorage.getItem("voxcpm-app-language");
    return saved === "zh" || saved === "en" ? saved : "zh";
  });
  const [shellState, setShellState] = useState<ShellState | null>(null);
  const [status, setStatus] = useState<ShellStatus>({
    state: "starting",
    message: messages.zh.starting,
    detail: "",
  });
  const [voices, setVoices] = useState<AppVoice[]>([]);
  const [generations, setGenerations] = useState<AppGeneration[]>([]);
  const [appDataState, setAppDataState] = useState<AppDataState>("idle");
  const [appDataError, setAppDataError] = useState("");

  const t = useMemo(() => {
    return (key: MessageKey) => messages[language][key] ?? messages.en[key];
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem("voxcpm-app-language", language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  useEffect(() => {
    window.voxcpmShell?.getShellState().then((state) => {
      setShellState(state);
      setStatus(state.status);
    });
    window.voxcpmShell?.onStatus((payload) => setStatus(payload));
  }, []);

  const loadAppData = useCallback(async () => {
    if (!window.voxcpmShell?.listVoices || !window.voxcpmShell?.listGenerations) {
      setAppDataState("ready");
      return;
    }

    setAppDataState("loading");
    setAppDataError("");
    try {
      const [voiceResult, generationResult] = await Promise.all([
        window.voxcpmShell.listVoices(),
        window.voxcpmShell.listGenerations(),
      ]);
      setVoices(voiceResult.items);
      setGenerations(generationResult.items);
      setAppDataState("ready");
    } catch (error) {
      setAppDataState("failed");
      setAppDataError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  const activeNav = useMemo(() => navItems.find((item) => item.key === activePage), [activePage]);
  const appReady = status.state === "ready";

  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Primary">
        <div className="brand-mark">
          <Sparkles size={24} strokeWidth={2.1} />
        </div>
        <nav className="rail-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const label = t(item.labelKey);
            return (
              <button
                key={item.key}
                className={`rail-button ${activePage === item.key ? "active" : ""}`}
                title={label}
                aria-label={label}
                onClick={() => setActivePage(item.key)}
              >
                <Icon size={23} strokeWidth={2.05} />
              </button>
            );
          })}
        </nav>
        <div className="version">dev</div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t("appTitle")}</p>
            <h1>{activeNav ? t(activeNav.labelKey) : ""}</h1>
          </div>
          <div className="topbar-actions">
            <LanguageSwitch language={language} setLanguage={setLanguage} />
            <BackendPill status={status} t={t} />
          </div>
        </header>

        {activePage === "design" && (
          <GenerationPage
            mode={t("navDesign")}
            status={status}
            appReady={appReady}
            accent="design"
            modeKey="voice-design"
            description={t("designDescription")}
            voices={voices}
            reload={loadAppData}
            t={t}
          />
        )}
        {activePage === "clone" && (
          <GenerationPage
            mode={t("navClone")}
            status={status}
            appReady={appReady}
            accent="clone"
            modeKey="voice-cloning"
            description={t("cloneDescription")}
            voices={voices}
            reload={loadAppData}
            t={t}
          />
        )}
        {activePage === "ultimate" && (
          <GenerationPage
            mode={t("navUltimate")}
            status={status}
            appReady={appReady}
            accent="ultimate"
            modeKey="ultimate-cloning"
            description={t("ultimateDescription")}
            voices={voices}
            reload={loadAppData}
            t={t}
          />
        )}
        {activePage === "loraTraining" && (
          <ReservedFeaturePage
            mode={t("navLoraTraining")}
            modeKey="lora-training"
            description={t("loraTrainingDescription")}
            t={t}
          />
        )}
        {activePage === "loraInference" && (
          <ReservedFeaturePage
            mode={t("navLoraInference")}
            modeKey="lora-inference"
            description={t("loraInferenceDescription")}
            t={t}
          />
        )}
        {activePage === "library" && (
          <VoiceLibraryPage
            voices={voices}
            appDataState={appDataState}
            appDataError={appDataError}
            reload={loadAppData}
            t={t}
          />
        )}
        {activePage === "history" && (
          <HistoryPage
            generations={generations}
            appDataState={appDataState}
            appDataError={appDataError}
            reload={loadAppData}
            t={t}
          />
        )}
        {activePage === "settings" && (
          <SettingsPage
            status={status}
            shellState={shellState}
            language={language}
            setLanguage={setLanguage}
            t={t}
          />
        )}
      </main>
    </div>
  );
}

function LanguageSwitch({
  language,
  setLanguage,
}: {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
}) {
  return (
    <div className="language-switch" aria-label="Interface language">
      <Languages size={17} />
      <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>
        EN
      </button>
      <button className={language === "zh" ? "active" : ""} type="button" onClick={() => setLanguage("zh")}>
        中
      </button>
    </div>
  );
}

function BackendPill({ status, t }: { status: ShellStatus; t: (key: MessageKey) => string }) {
  return (
    <div className={`backend-pill ${status.state}`}>
      <span />
      <strong>{status.state === "ready" ? t("appReady") : status.message}</strong>
    </div>
  );
}

function GenerationPage({
  mode,
  status,
  appReady,
  accent,
  modeKey,
  description,
  voices,
  reload,
  t,
}: {
  mode: string;
  status: ShellStatus;
  appReady: boolean;
  accent: string;
  modeKey: FeatureMode;
  description: string;
  voices: AppVoice[];
  reload: () => Promise<void>;
  t: (key: MessageKey) => string;
}) {
  const [inputText, setInputText] = useState("VoxCPM brings local voice generation into a reusable desktop workflow.");
  const [controlInstruction, setControlInstruction] = useState("A calm, natural voice with clear pacing.");
  const [promptText, setPromptText] = useState("");
  const [cfgValue, setCfgValue] = useState(2);
  const [inferenceTimesteps, setInferenceTimesteps] = useState(10);
  const [normalize, setNormalize] = useState(false);
  const [denoise, setDenoise] = useState(false);
  const [referenceKind, setReferenceKind] = useState<ReferenceKind>(modeKey === "voice-design" ? "none" : "saved_voice");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<SelectedAudioFile | null>(null);
  const [generatedRecord, setGeneratedRecord] = useState<AppGeneration | null>(null);
  const [generatedVoiceName, setGeneratedVoiceName] = useState(t("generatedVoiceName"));
  const [uploadVoiceName, setUploadVoiceName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supportsReference = modeKey !== "voice-design";
  const requiresReference = modeKey === "ultimate-cloning";

  useEffect(() => {
    if (modeKey === "voice-design") {
      setReferenceKind("none");
      return;
    }
    if (!selectedVoiceId && voices.length > 0) {
      setSelectedVoiceId(voices[0].id);
      setReferenceKind("saved_voice");
    }
    if (voices.length === 0 && referenceKind === "saved_voice") {
      setReferenceKind("upload");
    }
  }, [modeKey, referenceKind, selectedVoiceId, voices]);

  const selectAudio = async () => {
    const selected = await window.voxcpmShell?.selectAudioFile();
    if (selected) {
      setUploadedFile(selected);
      setReferenceKind("upload");
      setUploadVoiceName(selected.name.replace(/\.[^.]+$/, ""));
    }
  };

  const saveUploadedVoice = async () => {
    if (!uploadedFile || !uploadVoiceName.trim()) {
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await window.voxcpmShell?.createVoice({
        source_audio_path: uploadedFile.path,
        display_name: uploadVoiceName.trim(),
        source: "upload",
      });
      setMessage(t("saveSuccess"));
      await reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const generate = async () => {
    setMessage("");
    setError("");
    const reference = buildReferencePayload(referenceKind, selectedVoiceId, uploadedFile);
    if (supportsReference && requiresReference && reference.kind === "none") {
      setError(t("missingReference"));
      return;
    }
    if (supportsReference && modeKey === "voice-cloning" && reference.kind === "none") {
      setError(t("missingReference"));
      return;
    }

    setIsGenerating(true);
    try {
      const record = await window.voxcpmShell?.generateAudio({
        input_text: inputText,
        control_instruction: modeKey === "ultimate-cloning" && promptText.trim() ? "" : controlInstruction,
        prompt_text: modeKey === "ultimate-cloning" ? promptText : "",
        cfg_value: cfgValue,
        inference_timesteps: inferenceTimesteps,
        normalize,
        denoise,
        reference,
      });
      if (record) {
        setGeneratedRecord(record);
      }
      await reload();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : String(generateError));
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedVoice = async () => {
    if (!generatedRecord?.output_audio_path || !generatedVoiceName.trim()) {
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await window.voxcpmShell?.createVoice({
        source_audio_path: generatedRecord.output_audio_path,
        display_name: generatedVoiceName.trim(),
        tags: ["generated"],
        source: "generated",
      });
      setMessage(t("saveSuccess"));
      await reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={`generation-grid ${accent}`}>
      <div className="mode-panel">
        <div className="mode-header">
          <SlidersHorizontal size={20} />
          <span>{mode}</span>
        </div>
        <p className="mode-description">{description}</p>
        <div className="quick-controls">
          <button className="primary-action" disabled={!appReady || isGenerating} onClick={generate} type="button">
            <Sparkles size={18} />
            {isGenerating ? status.message : t("generate")}
          </button>
          <button className="ghost-action" disabled={!appReady} onClick={reload} type="button">
            <RefreshCw size={18} />
            {t("retry")}
          </button>
        </div>
        <div className="field-stack">
          <label>
            <span>{t("model")}</span>
            <input value="openbmb/VoxCPM2" readOnly />
          </label>
          <label>
            <span>{t("cfgValue")}</span>
            <input min={0.1} max={10} step={0.1} type="number" value={cfgValue} onChange={(event) => setCfgValue(Number(event.target.value))} />
          </label>
          <label>
            <span>{t("steps")}</span>
            <input min={1} max={100} step={1} type="number" value={inferenceTimesteps} onChange={(event) => setInferenceTimesteps(Number(event.target.value))} />
          </label>
          <label className="checkbox-row">
            <input checked={normalize} type="checkbox" onChange={(event) => setNormalize(event.target.checked)} />
            <span>{t("normalize")}</span>
          </label>
          <label className="checkbox-row">
            <input checked={denoise} type="checkbox" onChange={(event) => setDenoise(event.target.checked)} />
            <span>{t("denoise")}</span>
          </label>
        </div>
      </div>

      <div className="native-workbench generation-workbench">
        {!appReady && <LoadingPanel status={status} />}
        {appReady && (
          <>
            <div className="prompt-workspace">
              <label>
                <span>{t("targetText")}</span>
                <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} />
              </label>
              <label>
                <span>{t("controlInstruction")}</span>
                <textarea value={controlInstruction} onChange={(event) => setControlInstruction(event.target.value)} />
              </label>
              {modeKey === "ultimate-cloning" && (
                <label>
                  <span>{t("promptTranscript")}</span>
                  <textarea value={promptText} onChange={(event) => setPromptText(event.target.value)} />
                </label>
              )}
            </div>
            <aside className="result-panel">
              {supportsReference && (
                <ReferencePicker
                  voices={voices}
                  referenceKind={referenceKind}
                  selectedVoiceId={selectedVoiceId}
                  uploadedFile={uploadedFile}
                  uploadVoiceName={uploadVoiceName}
                  isSaving={isSaving}
                  setReferenceKind={setReferenceKind}
                  setSelectedVoiceId={setSelectedVoiceId}
                  setUploadVoiceName={setUploadVoiceName}
                  selectAudio={selectAudio}
                  saveUploadedVoice={saveUploadedVoice}
                  t={t}
                />
              )}
              <div className="result-header">
                <FileAudio size={20} />
                <h2>{t("generationOutput")}</h2>
              </div>
              {generatedRecord?.output_audio_path ? (
                <div className="audio-result">
                  <audio controls src={mediaUrl(generatedRecord.output_audio_path)} />
                  <dl className="adapter-summary">
                    <dt>{t("status")}</dt>
                    <dd>{generatedRecord.status}</dd>
                    <dt>{t("sampleRate")}</dt>
                    <dd>{generatedRecord.sample_rate ? `${generatedRecord.sample_rate} Hz` : "--"}</dd>
                  </dl>
                  <div className="inline-save">
                    <input value={generatedVoiceName} onChange={(event) => setGeneratedVoiceName(event.target.value)} />
                    <button className="ghost-action" disabled={isSaving} onClick={saveGeneratedVoice} type="button">
                      <Save size={17} />
                      {t("saveGeneratedVoice")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="audio-placeholder">
                  <Play size={22} />
                  <span>{generatedRecord?.status === "failed" ? generatedRecord.error_summary : t("noGeneration")}</span>
                </div>
              )}
              {message && <p className="status-line success">{message}</p>}
              {error && <p className="status-line error">{error}</p>}
            </aside>
          </>
        )}
      </div>
    </section>
  );
}

function ReferencePicker({
  voices,
  referenceKind,
  selectedVoiceId,
  uploadedFile,
  uploadVoiceName,
  isSaving,
  setReferenceKind,
  setSelectedVoiceId,
  setUploadVoiceName,
  selectAudio,
  saveUploadedVoice,
  t,
}: {
  voices: AppVoice[];
  referenceKind: ReferenceKind;
  selectedVoiceId: string;
  uploadedFile: SelectedAudioFile | null;
  uploadVoiceName: string;
  isSaving: boolean;
  setReferenceKind: (kind: ReferenceKind) => void;
  setSelectedVoiceId: (id: string) => void;
  setUploadVoiceName: (name: string) => void;
  selectAudio: () => void;
  saveUploadedVoice: () => void;
  t: (key: MessageKey) => string;
}) {
  return (
    <div className="reference-panel">
      <span className="field-title">{t("referenceSource")}</span>
      <div className="segmented-control">
        <button className={referenceKind === "upload" ? "active" : ""} type="button" onClick={() => setReferenceKind("upload")}>
          <Upload size={15} />
          {t("uploadedAudio")}
        </button>
        <button className={referenceKind === "saved_voice" ? "active" : ""} type="button" onClick={() => setReferenceKind("saved_voice")}>
          <Library size={15} />
          {t("savedVoice")}
        </button>
      </div>
      {referenceKind === "upload" && (
        <div className="reference-stack">
          <button className="ghost-action" type="button" onClick={selectAudio}>
            <Upload size={17} />
            {t("selectAudio")}
          </button>
          {uploadedFile && <p>{`${t("selectedAudio")}: ${uploadedFile.name}`}</p>}
          {uploadedFile && (
            <div className="inline-save">
              <input value={uploadVoiceName} onChange={(event) => setUploadVoiceName(event.target.value)} />
              <button className="ghost-action" disabled={isSaving} type="button" onClick={saveUploadedVoice}>
                <Save size={17} />
                {t("saveUploadedVoice")}
              </button>
            </div>
          )}
        </div>
      )}
      {referenceKind === "saved_voice" && (
        <select value={selectedVoiceId} onChange={(event) => setSelectedVoiceId(event.target.value)}>
          {voices.length === 0 && <option value="">{t("noSavedVoices")}</option>}
          {voices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.display_name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function buildReferencePayload(
  referenceKind: ReferenceKind,
  selectedVoiceId: string,
  uploadedFile: SelectedAudioFile | null,
): GenerateAudioPayload["reference"] {
  if (referenceKind === "upload" && uploadedFile) {
    return { kind: "upload", path: uploadedFile.path };
  }
  if (referenceKind === "saved_voice" && selectedVoiceId) {
    return { kind: "saved_voice", voice_id: selectedVoiceId };
  }
  return { kind: "none" };
}

function LoadingPanel({ status }: { status: ShellStatus }) {
  return (
    <div className="loading-panel">
      <div className="loading-bar" />
      <h2>{status.message}</h2>
      <pre>{status.detail}</pre>
    </div>
  );
}

function ReservedFeaturePage({
  mode,
  modeKey,
  description,
  t,
}: {
  mode: string;
  modeKey: FeatureMode;
  description: string;
  t: (key: MessageKey) => string;
}) {
  return (
    <section className="generation-grid reserved">
      <div className="mode-panel">
        <div className="mode-header">
          <SlidersHorizontal size={20} />
          <span>{mode}</span>
        </div>
        <p className="mode-description">{description}</p>
        <div className="field-stack">
          <label>
            <span>{t("pretrainedModel")}</span>
            <input value="openbmb/VoxCPM2" readOnly />
          </label>
          <label>
            <span>{modeKey === "lora-training" ? t("trainingManifest") : t("loraCheckpoint")}</span>
            <input value={modeKey === "lora-training" ? "examples/train_data_example.jsonl" : "None"} readOnly />
          </label>
          <label>
            <span>{t("outputDirectory")}</span>
            <input value={modeKey === "lora-training" ? "lora/" : "data/app/generations/"} readOnly />
          </label>
        </div>
      </div>
      <div className="native-workbench reserved-workbench">
        <div className="adapter-card">
          <h2>{mode}</h2>
          <p>{description}</p>
        </div>
      </div>
    </section>
  );
}

function VoiceLibraryPage({
  voices,
  appDataState,
  appDataError,
  reload,
  t,
}: {
  voices: AppVoice[];
  appDataState: AppDataState;
  appDataError: string;
  reload: () => Promise<void>;
  t: (key: MessageKey) => string;
}) {
  const [selectedFile, setSelectedFile] = useState<SelectedAudioFile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isLoading = appDataState === "loading" || appDataState === "idle";

  const selectFile = async () => {
    const file = await window.voxcpmShell?.selectAudioFile();
    if (file) {
      setSelectedFile(file);
      setDisplayName(file.name.replace(/\.[^.]+$/, ""));
      setError("");
    }
  };

  const createVoice = async () => {
    if (!selectedFile || !displayName.trim()) {
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await window.voxcpmShell?.createVoice({
        source_audio_path: selectedFile.path,
        display_name: displayName.trim(),
        tags: parseTags(tags),
        notes,
        source: "upload",
      });
      setSelectedFile(null);
      setDisplayName("");
      setTags("");
      setNotes("");
      await reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="library-layout">
      <div className="import-panel">
        <div className="section-actions">
          <button className="ghost-action" type="button" onClick={selectFile}>
            <Download size={18} />
            {t("importVoice")}
          </button>
          <button className="primary-action" disabled={!selectedFile || !displayName.trim() || isSaving} type="button" onClick={createVoice}>
            <Sparkles size={18} />
            {t("createVoice")}
          </button>
        </div>
        <div className="import-fields">
          <label>
            <span>{t("voiceName")}</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <label>
            <span>{t("tags")}</span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} />
          </label>
          <label>
            <span>{t("notes")}</span>
            <input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>
        {selectedFile && <p>{`${t("selectedAudio")}: ${selectedFile.name}`}</p>}
        {error && <p className="status-line error">{error}</p>}
      </div>
      {isLoading && <EmptyState title={t("loadingData")} />}
      {appDataState === "failed" && <EmptyState title={t("loadFailed")} detail={appDataError} actionLabel={t("retry")} onAction={reload} />}
      {appDataState === "ready" && voices.length === 0 && <EmptyState title={t("noSavedVoices")} />}
      <div className="voice-card-grid">
        {voices.map((voice) => (
          <article className="voice-card" key={voice.id}>
            <div className="voice-card-title">
              <AudioWaveform size={20} />
              <h2>{voice.display_name}</h2>
            </div>
            <p>{voice.notes || voice.audio_path}</p>
            <audio controls src={mediaUrl(voice.audio_path)} />
            <div className="tag-row">
              {voice.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="card-actions">
              <button title={t("download")} aria-label={t("download")}>
                <Download size={17} />
              </button>
              <button title={t("edit")} aria-label={t("edit")}>
                <SlidersHorizontal size={17} />
              </button>
              <button title={t("more")} aria-label={t("more")}>
                <MoreHorizontal size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HistoryPage({
  generations,
  appDataState,
  appDataError,
  reload,
  t,
}: {
  generations: AppGeneration[];
  appDataState: AppDataState;
  appDataError: string;
  reload: () => void;
  t: (key: MessageKey) => string;
}) {
  const isLoading = appDataState === "loading" || appDataState === "idle";
  return (
    <section className="history-list">
      {isLoading && <EmptyState title={t("loadingData")} />}
      {appDataState === "failed" && <EmptyState title={t("loadFailed")} detail={appDataError} actionLabel={t("retry")} onAction={reload} />}
      {appDataState === "ready" && generations.length === 0 && <EmptyState title={t("noHistoryItems")} />}
      {generations.map((row) => (
        <article className="history-row" key={row.id}>
          <AudioWaveform size={22} className="wave-icon" />
          <div className="history-main">
            <h2>{row.status}</h2>
            <p>{row.sample_rate ? `${row.sample_rate} Hz` : t("noOutput")}</p>
            <span>{row.created_at}</span>
          </div>
          <div className="history-text">
            <strong>{row.voice_id || row.reference_audio_path || t("noReference")}</strong>
            <p>{row.input_text}</p>
            {row.error_summary && <p className="status-line error">{row.error_summary}</p>}
          </div>
          <div className="history-actions">
            {row.output_audio_path && <audio controls src={mediaUrl(row.output_audio_path)} />}
            <button title={t("favorite")} aria-label={t("favorite")}>
              <Star size={19} />
            </button>
            <button title={t("more")} aria-label={t("more")}>
              <MoreHorizontal size={19} />
            </button>
          </div>
        </article>
      ))}
      <div className="end-note">{t("endReached")}</div>
    </section>
  );
}

function EmptyState({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {detail && <p>{detail}</p>}
      {actionLabel && onAction && (
        <button className="ghost-action" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SettingsPage({
  status,
  shellState,
  language,
  setLanguage,
  t,
}: {
  status: ShellStatus;
  shellState: ShellState | null;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: MessageKey) => string;
}) {
  return (
    <section className="settings-grid">
      <div className="settings-panel">
        <h2>{t("runtime")}</h2>
        <dl>
          <dt>{t("backend")}</dt>
          <dd>{status.state}</dd>
          <dt>{t("appMode")}</dt>
          <dd>{shellState?.appMode ?? "app-shell"}</dd>
          <dt>{t("port")}</dt>
          <dd>{shellState?.mainPort ?? 8818}</dd>
          <dt>{t("appBackend")}</dt>
          <dd>{shellState?.appBackendUrl ?? "http://127.0.0.1:8818"}</dd>
          <dt>{t("legacyBackend")}</dt>
          <dd>{shellState?.legacyBackendUrl ?? "http://127.0.0.1:8808"}</dd>
        </dl>
      </div>
      <div className="settings-panel">
        <h2>{t("interface")}</h2>
        <dl>
          <dt>{t("interfaceLanguage")}</dt>
          <dd>
            <LanguageSwitch language={language} setLanguage={setLanguage} />
          </dd>
          <dt>{t("language")}</dt>
          <dd>{language === "zh" ? t("chinese") : t("english")}</dd>
          <dt>{t("appMode")}</dt>
          <dd>{t("languageHint")}</dd>
        </dl>
      </div>
      <div className="settings-panel">
        <h2>{t("localPaths")}</h2>
        <dl>
          <dt>{t("project")}</dt>
          <dd>{shellState?.projectDir ?? "F:\\.VoxCPM\\VoxCPM"}</dd>
          <dt>{t("outputLog")}</dt>
          <dd>{shellState?.appBackendOutLogPath ?? "voxcpm_app_backend.out.log"}</dd>
          <dt>{t("errorLog")}</dt>
          <dd>{shellState?.appBackendErrLogPath ?? "voxcpm_app_backend.err.log"}</dd>
          <dt>{t("gradioRoute")}</dt>
          <dd>{t("gradioRouteValue")}</dd>
        </dl>
      </div>
    </section>
  );
}

function mediaUrl(projectRelativePath: string): string {
  return window.voxcpmShell?.mediaUrl(projectRelativePath) ?? "";
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,\s，]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
