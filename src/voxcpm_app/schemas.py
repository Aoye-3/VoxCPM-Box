from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


GENERATION_STATUSES = {"pending", "running", "succeeded", "failed", "cancelled", "deleted"}


@dataclass(frozen=True)
class VoiceRecord:
    id: str
    display_name: str
    tags: list[str]
    notes: str
    source: str
    audio_path: str
    audio_sha256: str
    duration_seconds: float | None
    created_at: str
    updated_at: str
    last_used_at: str | None
    deleted_at: str | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class GenerationRecord:
    id: str
    input_text: str
    control_instruction: str
    voice_id: str | None
    reference_audio_path: str | None
    prompt_text: str
    cfg_value: float
    inference_timesteps: int
    normalize: bool
    denoise: bool
    output_audio_path: str | None
    sample_rate: int | None
    status: str
    error_summary: str
    created_at: str
    updated_at: str
    deleted_at: str | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

