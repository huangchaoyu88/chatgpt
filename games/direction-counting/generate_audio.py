from __future__ import annotations

import asyncio
import json
from pathlib import Path
import edge_tts

SOURCE = Path(__file__).parent
VOICE = "zh-TW-HsiaoChenNeural"
RATE = "-12%"
OUT = SOURCE / "audio"
TEXTS = json.loads((SOURCE / "voices.json").read_text(encoding="utf-8"))

async def generate(key: str, text: str) -> None:
    target = OUT / f"{key}.mp3"
    temporary = OUT / f"{key}.tmp.mp3"
    for attempt in range(3):
        try:
            await asyncio.wait_for(
                edge_tts.Communicate(text, VOICE, rate=RATE).save(str(temporary)),
                timeout=35,
            )
            data = temporary.read_bytes()
            if len(data) < 1000 or not (
                data.startswith(b"ID3") or any(data[i] == 255 and data[i+1] & 224 == 224 for i in range(min(512, len(data)-1)))
            ):
                raise RuntimeError(f"Invalid MP3 for {key}")
            temporary.replace(target)
            print(f"OK {key}", flush=True)
            return
        except Exception:
            temporary.unlink(missing_ok=True)
            if attempt == 2:
                raise
            await asyncio.sleep(2 ** (attempt + 1))

async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, text in TEXTS.items():
        await generate(key, text)
    for key in TEXTS:
        if not (OUT / f"{key}.mp3").is_file():
            raise RuntimeError(f"Missing Edge TTS prompt: {key}")
    print(f"Verified {len(TEXTS)} Edge TTS prompts with {VOICE}")

if __name__ == "__main__":
    asyncio.run(main())
