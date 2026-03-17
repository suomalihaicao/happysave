#!/usr/bin/env python3
"""
本地 Whisper API 服务器 (OpenAI 兼容)
提供 /v1/audio/transcriptions 端点
"""

import os
import sys
import json
import subprocess
import tempfile
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 8765
WHISPER_MODEL = "base"

class WhisperHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # 禁用日志

    def do_GET(self):
        if self.path == "/v1/models":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "data": [{"id": "whisper-1", "object": "model", "owned_by": "local"}]
            }).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/v1/audio/transcriptions":
            self.handle_transcription()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_transcription(self):
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self.send_error(400, "Expected multipart/form-data")
            return

        # 读取 boundary
        boundary = content_type.split("boundary=")[1].strip()
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))

        # 解析 multipart 数据提取文件
        parts = body.split(f"--{boundary}".encode())
        audio_data = None
        filename = "audio.wav"

        for part in parts:
            if b"filename=" in part:
                header_end = part.find(b"\r\n\r\n")
                if header_end > 0:
                    headers = part[:header_end].decode("utf-8", errors="ignore")
                    if 'filename="' in headers:
                        fn_start = headers.index('filename="') + 10
                        fn_end = headers.index('"', fn_start)
                        filename = headers[fn_start:fn_end]

                    file_data = part[header_end + 4:]
                    # 去掉结尾的 \r\n
                    if file_data.endswith(b"\r\n"):
                        file_data = file_data[:-2]

                    if len(file_data) > 100:  # 有效文件数据
                        audio_data = file_data
                        break

        if not audio_data:
            self.send_error(400, "No audio file found")
            return

        try:
            # 保存到临时文件
            ext = os.path.splitext(filename)[1] or ".wav"
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f:
                f.write(audio_data)
                tmp_path = f.name

            # 调用 whisper CLI
            output_dir = "/tmp/whisper-api"
            os.makedirs(output_dir, exist_ok=True)

            result = subprocess.run(
                ["whisper", tmp_path, "--model", WHISPER_MODEL,
                 "--language", "zh", "--output_format", "txt",
                 "--output_dir", output_dir, "--verbose", "False"],
                capture_output=True, text=True, timeout=120
            )

            # 读取输出
            txt_file = os.path.join(output_dir, os.path.splitext(os.path.basename(tmp_path))[0] + ".txt")
            text = ""
            if os.path.exists(txt_file):
                with open(txt_file, "r") as f:
                    text = f.read().strip()
                os.unlink(txt_file)

            # 清理
            os.unlink(tmp_path)

            if not text:
                text = result.stdout.strip() or "(无识别结果)"

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"text": text}).encode())

        except subprocess.TimeoutExpired:
            self.send_error(500, "Whisper timeout")
        except Exception as e:
            self.send_error(500, f"Error: {str(e)}")


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), WhisperHandler)
    print(f"🎤 Whisper API 服务启动: http://127.0.0.1:{PORT}")
    print(f"   模型: {WHISPER_MODEL}")
    print(f"   端点: POST /v1/audio/transcriptions")
    server.serve_forever()
