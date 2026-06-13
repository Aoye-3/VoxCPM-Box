from __future__ import annotations

import json
import sqlite3
from dataclasses import replace

from .db import utc_now
from .schemas import GenerationRecord, VoiceRecord


def _voice_from_row(row: sqlite3.Row) -> VoiceRecord:
    return VoiceRecord(
        id=row["id"],
        display_name=row["display_name"],
        tags=json.loads(row["tags"]),
        notes=row["notes"],
        source=row["source"],
        audio_path=row["audio_path"],
        audio_sha256=row["audio_sha256"],
        duration_seconds=row["duration_seconds"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        last_used_at=row["last_used_at"],
        deleted_at=row["deleted_at"],
    )


def _generation_from_row(row: sqlite3.Row) -> GenerationRecord:
    return GenerationRecord(
        id=row["id"],
        input_text=row["input_text"],
        control_instruction=row["control_instruction"],
        voice_id=row["voice_id"],
        reference_audio_path=row["reference_audio_path"],
        prompt_text=row["prompt_text"],
        cfg_value=row["cfg_value"],
        inference_timesteps=row["inference_timesteps"],
        normalize=bool(row["normalize"]),
        denoise=bool(row["denoise"]),
        output_audio_path=row["output_audio_path"],
        sample_rate=row["sample_rate"],
        status=row["status"],
        error_summary=row["error_summary"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        deleted_at=row["deleted_at"],
    )


class VoiceRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def insert(self, record: VoiceRecord) -> VoiceRecord:
        self.conn.execute(
            """
            insert into voices (
                id, display_name, tags, notes, source, audio_path, audio_sha256,
                duration_seconds, created_at, updated_at, last_used_at, deleted_at
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record.id,
                record.display_name,
                json.dumps(record.tags, ensure_ascii=False),
                record.notes,
                record.source,
                record.audio_path,
                record.audio_sha256,
                record.duration_seconds,
                record.created_at,
                record.updated_at,
                record.last_used_at,
                record.deleted_at,
            ),
        )
        self.conn.commit()
        return record

    def get(self, voice_id: str) -> VoiceRecord | None:
        row = self.conn.execute("select * from voices where id = ?", (voice_id,)).fetchone()
        return _voice_from_row(row) if row else None

    def list(self, include_deleted: bool = False) -> list[VoiceRecord]:
        sql = "select * from voices"
        if not include_deleted:
            sql += " where deleted_at is null"
        sql += " order by created_at desc, rowid desc"
        return [_voice_from_row(row) for row in self.conn.execute(sql)]

    def update(self, voice_id: str, **fields: object) -> VoiceRecord:
        current = self.get(voice_id)
        if current is None:
            raise KeyError(f"voice not found: {voice_id}")
        updated = replace(current, updated_at=utc_now(), **fields)
        self.conn.execute(
            """
            update voices
            set display_name = ?, tags = ?, notes = ?, updated_at = ?
            where id = ?
            """,
            (
                updated.display_name,
                json.dumps(updated.tags, ensure_ascii=False),
                updated.notes,
                updated.updated_at,
                voice_id,
            ),
        )
        self.conn.commit()
        return updated

    def soft_delete(self, voice_id: str) -> VoiceRecord:
        current = self.get(voice_id)
        if current is None:
            raise KeyError(f"voice not found: {voice_id}")
        deleted = replace(current, deleted_at=utc_now(), updated_at=utc_now())
        self.conn.execute(
            "update voices set deleted_at = ?, updated_at = ? where id = ?",
            (deleted.deleted_at, deleted.updated_at, voice_id),
        )
        self.conn.commit()
        return deleted


class GenerationRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def insert(self, record: GenerationRecord) -> GenerationRecord:
        self.conn.execute(
            """
            insert into generations (
                id, input_text, control_instruction, voice_id, reference_audio_path,
                prompt_text, cfg_value, inference_timesteps, normalize, denoise,
                output_audio_path, sample_rate, status, error_summary, created_at,
                updated_at, deleted_at
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record.id,
                record.input_text,
                record.control_instruction,
                record.voice_id,
                record.reference_audio_path,
                record.prompt_text,
                record.cfg_value,
                record.inference_timesteps,
                int(record.normalize),
                int(record.denoise),
                record.output_audio_path,
                record.sample_rate,
                record.status,
                record.error_summary,
                record.created_at,
                record.updated_at,
                record.deleted_at,
            ),
        )
        self.conn.commit()
        return record

    def get(self, generation_id: str) -> GenerationRecord | None:
        row = self.conn.execute("select * from generations where id = ?", (generation_id,)).fetchone()
        return _generation_from_row(row) if row else None

    def list(self, include_deleted: bool = False) -> list[GenerationRecord]:
        sql = "select * from generations"
        if not include_deleted:
            sql += " where deleted_at is null"
        sql += " order by created_at desc, rowid desc"
        return [_generation_from_row(row) for row in self.conn.execute(sql)]

    def update(self, generation_id: str, **fields: object) -> GenerationRecord:
        current = self.get(generation_id)
        if current is None:
            raise KeyError(f"generation not found: {generation_id}")
        updated = replace(current, updated_at=utc_now(), **fields)
        self.conn.execute(
            """
            update generations
            set output_audio_path = ?, sample_rate = ?, status = ?, error_summary = ?,
                updated_at = ?, deleted_at = ?
            where id = ?
            """,
            (
                updated.output_audio_path,
                updated.sample_rate,
                updated.status,
                updated.error_summary,
                updated.updated_at,
                updated.deleted_at,
                generation_id,
            ),
        )
        self.conn.commit()
        return updated

