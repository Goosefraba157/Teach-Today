"""
Teach Today — WRS Grader Server
Local Flask server running Whisper medium for accurate phonics grading.

Usage:
    python grader.py

Then open lesson-21-s1.html — it will automatically use this server
instead of the browser Whisper model.

Endpoints:
    POST /grade   { card: {...}, audio: "<base64 webm>" }
              →   { correct, confidence, heard, grade }
    GET  /ping    → { ok: true }
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile, os, base64, re
from difflib import SequenceMatcher

app   = Flask(__name__)
CORS(app)   # allow browser fetch from file:// or any origin

print("⏳ Loading Whisper medium model…")
model = whisper.load_model("medium")
print("✅ Whisper medium ready\n")


# ── Acceptable phrase variants per card ──────────────────────────────────────

def build_targets(card: dict) -> list[str]:
    """Return a list of acceptable student responses for this card."""
    letters  = " ".join(card.get("ttsLetters", []))
    keyword  = card.get("keyword", "").lower()
    sound    = card.get("ttsSound",  "").lower()
    targets  = [
        f"{letters} {keyword} {sound}",  # full drill
        f"{letters} {keyword}",
        f"{keyword} {sound}",
        keyword,
        sound,
    ]
    # Include any extra targets defined in the card data
    targets += [t.lower() for t in card.get("recTargets", [])]
    return [t.strip() for t in targets if t.strip()]


def phrase_similarity(heard: str, target: str) -> float:
    return SequenceMatcher(None, heard, target).ratio()


def best_similarity(heard: str, targets: list[str]) -> float:
    return max((phrase_similarity(heard, t) for t in targets), default=0.0)


def clean(text: str) -> str:
    return re.sub(r"[.,!?;:'\"\\-]", "", text).lower().strip()


# ── Grade endpoint ────────────────────────────────────────────────────────────

@app.route("/grade", methods=["POST"])
def grade():
    data       = request.get_json(force=True)
    card       = data.get("card", {})
    audio_b64  = data.get("audio", "")

    if not audio_b64:
        return jsonify({"error": "no audio"}), 400

    # Build the prompt Whisper will use to bias recognition
    letters      = ", ".join(card.get("ttsLetters", []))
    keyword      = card.get("keyword", "")
    sound        = card.get("ttsSound", "")
    drill_phrase = f"{letters}, {keyword}, {sound}"
    prompt       = (
        f"The student is repeating a phonics drill: {drill_phrase}. "
        f"Expected words include: {keyword}, {sound}."
    )

    # Write audio to a temp file
    audio_bytes = base64.b64decode(audio_b64)
    suffix = ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        result = model.transcribe(
            tmp_path,
            language        = "en",
            temperature     = 0,
            initial_prompt  = prompt,
        )
        heard_raw = result.get("text", "")
        heard     = clean(heard_raw)
        print(f"[Whisper] card={card.get('id','?')} heard={repr(heard)}")

        targets    = build_targets(card)
        similarity = best_similarity(heard, targets)
        kw_present = keyword.lower() in heard

        # Grading logic
        # ≥ 0.75 similarity or keyword present → perfect
        # ≥ 0.40 → good (close enough, educationally acceptable)
        # below  → retry
        if similarity >= 0.75 or kw_present:
            grade   = "perfect"
            correct = True
        elif similarity >= 0.40 or any(t.split()[0] in heard for t in targets if t):
            grade   = "good"
            correct = True
        else:
            grade   = "retry"
            correct = False

        return jsonify({
            "correct":    correct,
            "grade":      grade,
            "confidence": round(similarity, 3),
            "heard":      heard,
        })

    except Exception as e:
        print(f"[Error] {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@app.route("/ping")
def ping():
    return jsonify({"ok": True, "model": "whisper-medium"})


if __name__ == "__main__":
    print("🚀 Grader running at http://localhost:5000")
    print("   Open lesson-21-s1.html — it will auto-detect this server.\n")
    app.run(host="127.0.0.1", port=5000, debug=False)
