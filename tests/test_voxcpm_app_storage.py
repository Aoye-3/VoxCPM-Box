from __future__ import annotations

import hashlib
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from voxcpm_app.db import initialize_database
from voxcpm_app.generation_history import (
    create_generation,
    delete_generation,
    list_generations,
    mark_generation_failed,
    mark_generation_running,
    mark_generation_succeeded,
)
from voxcpm_app.paths import AppPaths
from voxcpm_app.voice_library import create_voice, delete_voice, list_voices, update_voice


def test_database_initialization_is_idempotent(tmp_path: Path):
    paths = AppPaths.from_project_root(tmp_path)

    initialize_database(paths).close()
    initialize_database(paths).close()

    assert paths.db_path.exists()
    with sqlite3.connect(paths.db_path) as conn:
        versions = conn.execute("select version from schema_version order by version").fetchall()
        voice_table = conn.execute(
            "select name from sqlite_master where type = 'table' and name = 'voices'"
        ).fetchone()
        generation_table = conn.execute(
            "select name from sqlite_master where type = 'table' and name = 'generations'"
        ).fetchone()

    assert versions == [(1,)]
    assert voice_table == ("voices",)
    assert generation_table == ("generations",)
    assert paths.voices_dir.exists()
    assert paths.generations_dir.exists()
    assert paths.tmp_dir.exists()


def test_voice_lifecycle_copies_audio_and_hides_soft_deleted_records(tmp_path: Path):
    paths = AppPaths.from_project_root(tmp_path)
    source_audio = tmp_path / "uploaded.wav"
    source_audio.write_bytes(b"voice-bytes")

    voice = create_voice(
        paths,
        source_audio_path=source_audio,
        display_name="Studio Narrator",
        tags=["en", "narration"],
        notes="Clean delivery",
        source="upload",
        duration_seconds=1.25,
    )

    stored_path = tmp_path / voice.audio_path
    assert voice.display_name == "Studio Narrator"
    assert voice.tags == ["en", "narration"]
    assert voice.audio_path == f"data/app/voices/{voice.id}.wav"
    assert stored_path.read_bytes() == b"voice-bytes"
    assert voice.audio_sha256 == hashlib.sha256(b"voice-bytes").hexdigest()

    updated = update_voice(
        paths,
        voice.id,
        display_name="Narrator Updated",
        tags=["updated"],
        notes="New note",
    )
    assert updated.display_name == "Narrator Updated"
    assert updated.tags == ["updated"]
    assert updated.notes == "New note"
    assert [item.id for item in list_voices(paths)] == [voice.id]

    deleted = delete_voice(paths, voice.id)
    assert deleted.deleted_at is not None
    assert list_voices(paths) == []
    assert [item.id for item in list_voices(paths, include_deleted=True)] == [voice.id]


def test_generation_lifecycle_copies_output_and_hides_soft_deleted_records(tmp_path: Path):
    paths = AppPaths.from_project_root(tmp_path)
    generation = create_generation(
        paths,
        input_text="Hello world",
        control_instruction="warm voice",
        voice_id=None,
        reference_audio_path=None,
        prompt_text="",
        cfg_value=2.0,
        inference_timesteps=10,
        normalize=False,
        denoise=True,
    )
    assert generation.status == "pending"

    running = mark_generation_running(paths, generation.id)
    assert running.status == "running"

    output_audio = tmp_path / "result.wav"
    output_audio.write_bytes(b"generated-audio")
    succeeded = mark_generation_succeeded(
        paths,
        generation.id,
        source_output_audio_path=output_audio,
        sample_rate=48000,
    )

    assert succeeded.status == "succeeded"
    assert succeeded.output_audio_path == f"data/app/generations/{generation.id}.wav"
    assert (tmp_path / succeeded.output_audio_path).read_bytes() == b"generated-audio"
    assert succeeded.sample_rate == 48000

    failed = create_generation(
        paths,
        input_text="Bad request",
        control_instruction="",
        voice_id=None,
        reference_audio_path=None,
        prompt_text="",
        cfg_value=2.0,
        inference_timesteps=10,
        normalize=False,
        denoise=False,
    )
    failed = mark_generation_failed(paths, failed.id, error_summary="Model unavailable")
    assert failed.status == "failed"
    assert failed.error_summary == "Model unavailable"
    assert [item.id for item in list_generations(paths)] == [failed.id, generation.id]

    deleted = delete_generation(paths, generation.id)
    assert deleted.status == "deleted"
    assert deleted.deleted_at is not None
    assert [item.id for item in list_generations(paths)] == [failed.id]
    assert {item.id for item in list_generations(paths, include_deleted=True)} == {
        failed.id,
        generation.id,
    }
