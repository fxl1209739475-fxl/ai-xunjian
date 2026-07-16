# -*- coding: utf-8 -*-
# 转写 + 字幕构建：faster-whisper 词级时间戳 → ≤14字/行的逐字字幕
# 用法: uv run --with faster-whisper python asr_and_caps.py <音频.wav> <输出caps.json> [模型名]
import sys, json, os, re

audio, out = sys.argv[1], sys.argv[2]
model_name = sys.argv[3] if len(sys.argv) > 3 else os.environ.get("XUNJIAN_WHISPER_MODEL", "small")

# ── ASR 错字订正词典（通用样例版）──
# 转写常把英文品牌/术语拆错，按你的领域往下加即可；键=错误写法，值=正确写法
FIXES = [
    ("A I", "AI"),
    ("G P T", "GPT"),
    ("拆GPT", "ChatGPT"),
]

from faster_whisper import WhisperModel
m = WhisperModel(model_name, device="cpu", compute_type="int8")
segs, info = m.transcribe(audio, language="zh", beam_size=5, word_timestamps=True)

MAX = 14  # 每行最多字数（竖屏单行不换行的安全值）
caps = []
for s in segs:
    words = s.words or []
    if not words:
        caps.append({"s": round(s.start, 2), "e": round(s.end, 2), "z": s.text.strip()})
        continue
    line, ls = "", None
    for w in words:
        t = w.word
        if ls is None:
            ls = w.start
        # 空格开头 = whisper 的短语边界，优先在这里断行
        if line and (len(line) + len(t.strip()) > MAX or (t.startswith(" ") and len(line) >= 8)):
            caps.append({"s": round(ls, 2), "e": round(w.start, 2), "z": line})
            line, ls = "", w.start
        line += t.strip()
    if line:
        caps.append({"s": round(ls, 2), "e": round(words[-1].end, 2), "z": line})

for c in caps:
    for bad, good in FIXES:
        c["z"] = c["z"].replace(bad, good)

json.dump(caps, open(out, "w"), ensure_ascii=False, indent=1)
print(f"ASR_DONE lines={len(caps)} dur={caps[-1]['e'] if caps else 0}")
