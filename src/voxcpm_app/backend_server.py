from __future__ import annotations

import argparse
import json
import mimetypes
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from .generation_service import GenerationService
from .paths import AppPaths, default_project_root
from .service_cli import ACTIONS


def build_handler(paths: AppPaths, *, generation_service: GenerationService | None = None):
    service = generation_service or GenerationService(paths)

    class BackendHandler(BaseHTTPRequestHandler):
        server_version = "VoxCPMAppBackend/0.1"

        def do_GET(self) -> None:
            parsed = urlparse(self.path)
            if parsed.path == "/health":
                self._write_json(HTTPStatus.OK, {"ok": True})
                return
            if parsed.path == "/media":
                self._serve_media(parsed.query)
                return
            self._write_json(HTTPStatus.NOT_FOUND, {"error": "not found"})

        def do_POST(self) -> None:
            parsed = urlparse(self.path)
            try:
                payload = self._read_json()
                if parsed.path == "/app-service":
                    self._handle_app_service(payload)
                    return
                if parsed.path == "/generate-audio":
                    record = service.generate_audio(payload)
                    self._write_json(HTTPStatus.OK, record.to_dict())
                    return
                self._write_json(HTTPStatus.NOT_FOUND, {"error": "not found"})
            except (FileNotFoundError, KeyError, ValueError) as exc:
                self._write_json(
                    HTTPStatus.BAD_REQUEST,
                    {"error": str(exc), "type": type(exc).__name__},
                )
            except Exception as exc:
                self._write_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {"error": str(exc), "type": type(exc).__name__},
                )

        def log_message(self, format: str, *args: Any) -> None:
            return

        def _handle_app_service(self, payload: dict[str, Any]) -> None:
            action = payload.get("action")
            if not isinstance(action, str) or action not in ACTIONS:
                raise ValueError(f"unsupported app service action: {action}")
            action_payload = payload.get("payload")
            if action_payload is None:
                action_payload = {}
            if not isinstance(action_payload, dict):
                raise ValueError("app service payload must be an object")
            self._write_json(HTTPStatus.OK, ACTIONS[action](paths, action_payload))

        def _read_json(self) -> dict[str, Any]:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            payload = json.loads(raw or "{}")
            if not isinstance(payload, dict):
                raise ValueError("JSON payload must be an object")
            return payload

        def _write_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(int(status))
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _serve_media(self, query: str) -> None:
            value = parse_qs(query).get("path", [""])[0]
            if not value:
                self._write_json(HTTPStatus.BAD_REQUEST, {"error": "path is required"})
                return
            root = paths.project_root.resolve()
            media_path = (root / value).resolve()
            if root != media_path and root not in media_path.parents:
                self._write_json(HTTPStatus.BAD_REQUEST, {"error": "path is outside project"})
                return
            if not media_path.exists() or not media_path.is_file():
                self._write_json(HTTPStatus.NOT_FOUND, {"error": "media not found"})
                return

            content_type = mimetypes.guess_type(media_path.name)[0] or "application/octet-stream"
            data = media_path.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

    return BackendHandler


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="VoxCPM-Box AppShell backend")
    parser.add_argument("--project-root", default=str(default_project_root()))
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8818)
    parser.add_argument("--model-id", default=os.environ.get("VOXCPM_APP_MODEL_ID", "openbmb/VoxCPM2"))
    parser.add_argument("--device", default=os.environ.get("VOXCPM_APP_DEVICE", "cuda"))
    args = parser.parse_args(argv)

    paths = AppPaths.from_project_root(Path(args.project_root))
    _prepend_local_ffmpeg(paths.project_root)
    service = GenerationService(paths, model_id=args.model_id, device=args.device)
    server = ThreadingHTTPServer((args.host, args.port), build_handler(paths, generation_service=service))
    print(json.dumps({"ok": True, "host": args.host, "port": args.port}, ensure_ascii=False), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


def _prepend_local_ffmpeg(project_root: Path) -> None:
    ffmpeg = project_root / ".local-ffmpeg" / "ffmpeg.exe"
    if not ffmpeg.exists():
        return
    os.environ["PATH"] = str(ffmpeg.parent) + os.pathsep + os.environ.get("PATH", "")
    os.environ.setdefault("IMAGEIO_FFMPEG_EXE", str(ffmpeg))


if __name__ == "__main__":
    raise SystemExit(main())
