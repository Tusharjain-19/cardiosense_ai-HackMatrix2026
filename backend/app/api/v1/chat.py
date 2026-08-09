"""
CardioAI Backend — Chat API Endpoint
POST /api/chat
Sends user questions + analysis context to Claude API for
intelligent cardiac screening assistant responses.
"""

import os
import json
import urllib.request
from fastapi import APIRouter, Depends

from app.database.schemas import ChatRequest
from app.api.dependencies import get_current_user_optional
from app.database.models import User
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post("/chat")
async def chat(
    req: ChatRequest,
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Chat with CardioAI assistant (powered by Claude).
    Falls back to a heuristic response if the API is unavailable.
    """
    ctx = req.analysis_context or {}
    ai_pred = ctx.get("aiPrediction", {})
    prediction = ai_pred.get("class", "Normal")
    confidence = ai_pred.get("confidence", 0.95)
    hr = ctx.get("heartRate", {}).get("average", 72)
    quality = ctx.get("signalQuality", {}).get("score", 94)
    quality_status = ctx.get("signalQuality", {}).get("status", "GOOD")

    system_prompt = (
        "You are CardioAI Assistant, an AI screening assistant for cardiac "
        "signal recordings. Your task is to answer patient or user questions "
        "about their ECG/PPG screening results in a friendly, clear, "
        "non-diagnostic manner.\n"
        f"Active Recording Context:\n"
        f"- File Name: {ctx.get('fileName', 'recording.csv')}\n"
        f"- Classification: {prediction}\n"
        f"- AI Confidence: {confidence * 100:.1f}%\n"
        f"- Heart Rate: {hr} BPM\n"
        f"- Signal Quality: {quality}% ({quality_status})\n"
        "Guidelines:\n"
        "1. Explain heart rate metrics, confidence score, and focus areas "
        "in plain language.\n"
        "2. Keep responses concise (2-4 paragraphs max).\n"
        "3. Emphasize that results are an AI screening prototype, not a "
        "medical diagnosis.\n"
        "4. Always advise consulting a doctor for any health concerns."
    )

    anthropic_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY", "")

    if anthropic_key:
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            payload = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 500,
                "system": system_prompt,
                "messages": [
                    {"role": "user", "content": req.user_message}
                ],
            }
            data_bytes = json.dumps(payload).encode("utf-8")
            request = urllib.request.Request(
                url, data=data_bytes, headers=headers, method="POST"
            )

            with urllib.request.urlopen(request, timeout=15) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                content_text = res_body["content"][0]["text"]
                return {
                    "success": True,
                    "reply": content_text,
                    "model": "claude-3-5-sonnet",
                }

        except Exception as e:
            logger.warning(f"Claude API error: {e}")

    # Fallback response
    fallback = (
        f"Based on your recording ({prediction}, {confidence*100:.1f}% confidence), "
        f"your average heart rate was {hr} BPM with a signal quality of {quality}% "
        f"({quality_status}). This is an AI screening prototype result and not a "
        f"medical diagnosis. Please consult a healthcare professional for any "
        f"concerns about your cardiac health."
    )
    return {"success": True, "reply": fallback, "model": "local-fallback"}
