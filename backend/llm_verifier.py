"""
Optional local LLM issue verifier.

This module is intentionally narrow:
- It reviews a subset of existing issues
- It does not generate new issues
- It is called once per document
"""

import json
from urllib.request import Request, urlopen


class MinimalLLMVerifier:
    def __init__(self, model="qwen2.5:14b", endpoint="http://127.0.0.1:11434/api/generate", max_review_issues=12):
        self.model = model
        self.endpoint = endpoint
        self.max_review_issues = max_review_issues

    def review_once(self, text, issues):
        if not issues:
            return {"model": self.model, "calls_made": 1, "reviews": []}

        selected = issues[: self.max_review_issues]
        payload = {
            "model": self.model,
            "stream": False,
            "format": "json",
            "prompt": self._build_prompt(text, selected),
        }

        req = Request(
            self.endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=180) as resp:
            body = json.loads(resp.read().decode("utf-8"))

        raw = body.get("response", "").strip()
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"LLM returned non-JSON output: {raw[:180]}") from exc

        reviews = parsed.get("reviews", [])
        clean = []
        for row in reviews:
            if not isinstance(row, dict):
                continue
            idx = row.get("index")
            if not isinstance(idx, int):
                continue
            if idx < 0 or idx >= len(selected):
                continue
            confidence = str(row.get("confidence", "medium")).lower()
            if confidence not in {"high", "medium", "low"}:
                confidence = "medium"
            clean.append(
                {
                    "index": idx,
                    "confidence": confidence,
                    "reason": str(row.get("reason", "")).strip()[:240],
                }
            )

        return {
            "model": self.model,
            "calls_made": 1,
            "reviews": clean,
        }

    def _build_prompt(self, text, issues):
        issue_lines = []
        for i, issue in enumerate(issues):
            msg = issue.get("message", issue.get("issue", ""))
            sev = issue.get("severity", "low")
            cat = issue.get("category", "General")
            issue_lines.append(f"{i}. [{cat}][{sev}] {msg}")

        compact_text = " ".join(text.split())
        compact_text = compact_text[:2500]

        return (
            "You are validating existing writing-analysis issues.\n"
            "Task: review each issue and provide confidence + reason.\n"
            "Rules:\n"
            "- Do not create new issues\n"
            "- Keep index values exactly as provided\n"
            "- Return strict JSON with schema:\n"
            '{"reviews":[{"index":0,"confidence":"high|medium|low","reason":"..."}]}\n\n'
            f"TEXT:\n{compact_text}\n\n"
            "ISSUES:\n"
            + "\n".join(issue_lines)
        )
