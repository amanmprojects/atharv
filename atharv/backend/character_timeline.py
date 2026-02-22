"""
Character timeline analytics with heatmap data and reappearance prediction.
"""

from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List


ROLE_ORDER = {"main": 0, "supporting": 1, "background": 2, "mentioned": 3}


class CharacterTimeline:
    def analyze(self, char_result: Dict[str, Any], arc_result: Dict[str, Any], total_paragraphs: int) -> Dict[str, Any]:
        characters = {}
        if isinstance(char_result, dict):
            characters = char_result.get("characters", char_result) or {}
        arc_map = (arc_result or {}).get("arc_map", []) if isinstance(arc_result, dict) else []

        if total_paragraphs <= 0:
            total_paragraphs = len(arc_map)

        phase_by_para = {int(row.get("paragraph", 0)): row.get("phase", "Setup") for row in arc_map}
        color_by_phase = {(row.get("phase") or "Setup"): row.get("color", "#64748b") for row in arc_map}

        transition_points = self._transition_points(arc_map)
        climax_paragraphs = [p for p, phase in phase_by_para.items() if phase == "Climax"]
        resolution_paragraphs = [p for p, phase in phase_by_para.items() if phase == "Resolution"]
        first_resolution = min(resolution_paragraphs) if resolution_paragraphs else None

        character_profiles: List[Dict[str, Any]] = []
        predictions: List[Dict[str, Any]] = []
        issues: List[Dict[str, Any]] = []

        for name, para_indices in (characters or {}).items():
            seen = sorted({int(p) + 1 for p in para_indices if isinstance(p, int)})
            if not seen:
                continue

            total_appearances = len(seen)
            first_appearance = seen[0]
            last_appearance = seen[-1]
            coverage = total_appearances / max(total_paragraphs, 1)

            role = "background"
            if total_appearances <= 2:
                role = "mentioned"
            elif coverage >= 0.60:
                role = "main"
            elif coverage >= 0.20:
                role = "supporting"

            gaps = [seen[idx] - seen[idx - 1] for idx in range(1, len(seen))]
            avg_gap = round(sum(gaps) / len(gaps), 2) if gaps else float(total_paragraphs)
            longest_absence = max([max(g - 1, 0) for g in gaps], default=0)
            current_absence = max(total_paragraphs - last_appearance, 0)

            phase_distribution = Counter(phase_by_para.get(p, "Setup") for p in seen)
            arc_presence = sorted(phase_distribution.keys())

            profile = {
                "name": name,
                "appearances": seen,
                "total_appearances": total_appearances,
                "first_appearance": first_appearance,
                "last_appearance": last_appearance,
                "role": role,
                "avg_gap": avg_gap,
                "longest_absence": int(longest_absence),
                "current_absence": int(current_absence),
                "phase_distribution": dict(phase_distribution),
                "arc_presence": arc_presence,
            }
            character_profiles.append(profile)

            last_phase = phase_by_para.get(last_appearance, "")
            predicted_next = None if last_phase == "Resolution" else int(round(last_appearance + avg_gap))
            prediction_basis = f"Base: last_seen ({last_appearance}) + avg_gap ({avg_gap})."

            arc_obligation = None
            if role == "main":
                unresolved_climax = [p for p in climax_paragraphs if p >= last_appearance]
                unresolved_transitions = [p for p in transition_points if p >= last_appearance]
                if unresolved_climax:
                    predicted_next = unresolved_climax[0]
                    arc_obligation = f"Must appear at Climax - paragraph {min(climax_paragraphs)}-{max(climax_paragraphs)}"
                    prediction_basis = "Main character arc override: prioritize Climax presence."
                elif unresolved_transitions:
                    predicted_next = unresolved_transitions[0]
                    arc_obligation = f"Should appear around phase transition paragraph(s): {', '.join(str(x) for x in unresolved_transitions[:3])}"
                    prediction_basis = "Main character arc override: phase transition presence."

            warning = None
            if longest_absence > 0 and current_absence > (longest_absence * 1.5):
                warning = f"{name} is absent for {current_absence} paragraphs, beyond prior longest absence ({longest_absence})."

            predictions.append(
                {
                    "character": name,
                    "last_seen": last_appearance,
                    "predicted_next": predicted_next,
                    "prediction_basis": prediction_basis,
                    "arc_obligation": arc_obligation,
                    "warning": warning,
                }
            )

            if role == "main":
                max_run = self._max_absence_run(seen, total_paragraphs)
                if max_run > max(1, int(total_paragraphs * 0.15)):
                    issues.append(
                        {
                            "category": "Character Timeline",
                            "character": name,
                            "message": f"Main character absent for {max_run} paragraphs in a row.",
                            "suggestion": "Add short check-in beats to keep core arc continuity visible.",
                            "severity": "medium",
                            "paragraph": last_appearance,
                        }
                    )

            if role == "supporting" and first_resolution and last_appearance < first_resolution:
                issues.append(
                    {
                        "category": "Character Timeline",
                        "character": name,
                        "message": "Supporting character exits before Resolution with no return.",
                        "suggestion": "Add a brief return scene or explicit closure beat.",
                        "severity": "low",
                        "paragraph": last_appearance,
                    }
                )

            if total_appearances == 1:
                issues.append(
                    {
                        "category": "Character Timeline",
                        "character": name,
                        "message": "Character appears only once and may feel forgotten.",
                        "suggestion": "Either reintroduce this character later or merge with another role.",
                        "severity": "low",
                        "paragraph": first_appearance,
                    }
                )

        setup_paragraphs = {p for p, phase in phase_by_para.items() if phase == "Setup"}
        climax_paragraphs_set = set(climax_paragraphs)
        for profile in character_profiles:
            seen = set(profile["appearances"])
            if seen & climax_paragraphs_set and not (seen & setup_paragraphs):
                issues.append(
                    {
                        "category": "Character Timeline",
                        "character": profile["name"],
                        "message": "Character appears at Climax without Setup introduction.",
                        "suggestion": "Seed this character earlier with a short Setup appearance.",
                        "severity": "medium",
                        "paragraph": min(seen & climax_paragraphs_set),
                    }
                )

        timeline_grid = []
        for p in range(1, total_paragraphs + 1):
            present = [profile["name"] for profile in character_profiles if p in set(profile["appearances"])]
            phase = phase_by_para.get(p, "Setup")
            timeline_grid.append(
                {
                    "paragraph": p,
                    "phase": phase,
                    "phase_color": color_by_phase.get(phase, "#64748b"),
                    "characters_present": present,
                }
            )

        sorted_profiles = sorted(character_profiles, key=lambda row: (ROLE_ORDER.get(row["role"], 9), -row["total_appearances"], row["name"].lower()))
        sorted_names = [row["name"] for row in sorted_profiles]

        cells = []
        for name in sorted_names:
            present_set = set(next((row["appearances"] for row in sorted_profiles if row["name"] == name), []))
            for p in range(1, total_paragraphs + 1):
                cells.append(
                    {
                        "character": name,
                        "paragraph": p,
                        "present": p in present_set,
                        "phase": phase_by_para.get(p, "Setup"),
                    }
                )

        heatmap_data = {
            "paragraphs": list(range(1, total_paragraphs + 1)),
            "characters": sorted_names,
            "cells": cells,
        }

        predictions.sort(key=lambda row: (0 if row.get("warning") else 1, row.get("predicted_next") is None, row.get("predicted_next") or 10**9))

        return {
            "character_profiles": sorted_profiles,
            "timeline_grid": timeline_grid,
            "heatmap_data": heatmap_data,
            "predictions": predictions,
            "issues": issues,
        }

    def _transition_points(self, arc_map: List[Dict[str, Any]]) -> List[int]:
        points: List[int] = []
        previous_phase = None
        for row in arc_map:
            phase = row.get("phase")
            paragraph = int(row.get("paragraph", 0))
            if previous_phase is not None and phase != previous_phase and paragraph > 0:
                points.append(paragraph)
            previous_phase = phase
        return points

    def _max_absence_run(self, seen: List[int], total_paragraphs: int) -> int:
        present = set(seen)
        max_run = 0
        run = 0
        for p in range(1, total_paragraphs + 1):
            if p in present:
                run = 0
            else:
                run += 1
                max_run = max(max_run, run)
        return max_run
