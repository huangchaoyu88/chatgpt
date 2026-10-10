from __future__ import annotations

import asyncio
from pathlib import Path

import edge_tts

VOICE = "zh-TW-HsiaoChenNeural"
RATE = "-8%"
OUT = Path(__file__).parent / "audio"
TEXTS = {
    "questionLeft": "請從左邊開始數。圈起來的小動物，從左邊數來第幾個？",
    "questionRight": "請從右邊開始數。圈起來的小動物，從右邊數來第幾個？",
    "questionUp": "請從上面開始數。圈起來的小動物，從上面數來第幾個？",
    "questionDown": "請從下面開始數。圈起來的小動物，從下面數來第幾個？",
    "correct": "答對了！兔兔找到寶物了！",
    "combo": "連對三題！獲得一個魔法提示！",
    "retry": "再看一次箭頭，慢慢數一數！",
    "hint": "魔法提示：先從綠色小動物開始數！",
    "checkpoint": "這一關完成了！打開寶箱，準備下一關！",
    "finalCheckpoint": "四關完成！兔兔找到最後一張藏寶圖了！",
    "finish": "太棒了！兔兔大冒險完成！",
}

async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, text in TEXTS.items():
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(OUT / f"{key}.mp3"))
    if len(list(OUT.glob("*.mp3"))) != len(TEXTS):
        raise RuntimeError("Expected one Edge TTS audio file for each prompt")

if __name__ == "__main__":
    asyncio.run(main())
