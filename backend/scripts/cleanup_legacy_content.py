#!/usr/bin/env python3
"""
One-time cleanup utility for legacy TipTap storage objects.

Legacy path:
  content/{doc_id}.json

Canonical path:
  documents/{doc_id}/content.json

Usage:
  cd backend
  python3 scripts/cleanup_legacy_content.py
  python3 scripts/cleanup_legacy_content.py --apply --promote-missing-primary
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Optional

import firebase_admin
from firebase_admin import firestore, storage


LEGACY_PREFIX = "content/"
CANONICAL_TEMPLATE = "documents/{doc_id}/content.json"


@dataclass
class Summary:
    scanned: int = 0
    has_primary: int = 0
    missing_primary: int = 0
    missing_document: int = 0
    copied_to_primary: int = 0
    deleted_legacy: int = 0
    skipped: int = 0
    errors: int = 0


def parse_doc_id(blob_name: str) -> Optional[str]:
    if not blob_name.startswith(LEGACY_PREFIX) or not blob_name.endswith(".json"):
        return None
    filename = blob_name[len(LEGACY_PREFIX) :]
    if "/" in filename:
        return None
    return filename[: -len(".json")]


def initialize_firebase():
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
    if not project_id:
        project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()

    if not project_id:
        print(
            "ERROR: Missing GOOGLE_CLOUD_PROJECT (or FIREBASE_PROJECT_ID) in environment.",
            file=sys.stderr,
        )
        raise SystemExit(2)

    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET", "").strip()
    if not bucket_name:
        bucket_name = f"{project_id}.appspot.com"

    if not firebase_admin._apps:
        firebase_admin.initialize_app(
            options={
                "projectId": project_id,
                "storageBucket": bucket_name,
            }
        )

    db = firestore.client()
    bucket = storage.bucket(bucket_name)
    return db, bucket


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Cleanup/migrate legacy content/{doc_id}.json blobs."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Execute writes/deletes. Without this flag, runs in dry-run mode.",
    )
    parser.add_argument(
        "--promote-missing-primary",
        action="store_true",
        help=(
            "If canonical documents/{doc_id}/content.json is missing but a Firestore "
            "document exists, copy legacy blob to canonical path before deleting legacy."
        ),
    )
    parser.add_argument(
        "--delete-legacy-without-document",
        action="store_true",
        help=(
            "Delete legacy blobs that have no matching Firestore document. "
            "Useful for hard cleanup."
        ),
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Max number of legacy blobs to inspect (0 = no limit).",
    )
    args = parser.parse_args()

    db, bucket = initialize_firebase()
    summary = Summary()

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"Mode: {mode}")
    print(
        "Options:"
        f" promote_missing_primary={args.promote_missing_primary},"
        f" delete_legacy_without_document={args.delete_legacy_without_document},"
        f" limit={args.limit or 'none'}"
    )

    blobs_iter = bucket.list_blobs(prefix=LEGACY_PREFIX)
    for blob in blobs_iter:
        if args.limit and summary.scanned >= args.limit:
            break

        doc_id = parse_doc_id(blob.name)
        if not doc_id:
            continue

        summary.scanned += 1
        canonical_name = CANONICAL_TEMPLATE.format(doc_id=doc_id)
        canonical_blob = bucket.blob(canonical_name)
        canonical_exists = canonical_blob.exists()

        doc_ref = db.collection("documents").document(doc_id)
        doc_exists = doc_ref.get().exists

        if canonical_exists:
            summary.has_primary += 1
            action = "delete-legacy"
            print(f"[{summary.scanned}] {doc_id}: canonical exists -> {action}")
            if args.apply:
                try:
                    blob.delete()
                    summary.deleted_legacy += 1
                except Exception as exc:  # pragma: no cover
                    summary.errors += 1
                    print(f"  ERROR deleting legacy blob: {exc}")
            continue

        summary.missing_primary += 1

        if not doc_exists:
            summary.missing_document += 1
            if args.delete_legacy_without_document:
                print(
                    f"[{summary.scanned}] {doc_id}: missing canonical + missing doc -> "
                    "delete-legacy"
                )
                if args.apply:
                    try:
                        blob.delete()
                        summary.deleted_legacy += 1
                    except Exception as exc:  # pragma: no cover
                        summary.errors += 1
                        print(f"  ERROR deleting legacy blob: {exc}")
            else:
                summary.skipped += 1
                print(
                    f"[{summary.scanned}] {doc_id}: missing canonical + missing doc -> "
                    "skip"
                )
            continue

        if args.promote_missing_primary:
            print(
                f"[{summary.scanned}] {doc_id}: missing canonical + doc exists -> "
                "copy-to-canonical then delete-legacy"
            )
            if args.apply:
                try:
                    bucket.copy_blob(blob, bucket, new_name=canonical_name)
                    summary.copied_to_primary += 1
                    blob.delete()
                    summary.deleted_legacy += 1
                except Exception as exc:  # pragma: no cover
                    summary.errors += 1
                    print(f"  ERROR promoting/deleting blob: {exc}")
        else:
            summary.skipped += 1
            print(
                f"[{summary.scanned}] {doc_id}: missing canonical + doc exists -> skip "
                "(use --promote-missing-primary)"
            )

    print("\nSummary")
    print(f"  scanned: {summary.scanned}")
    print(f"  has_primary: {summary.has_primary}")
    print(f"  missing_primary: {summary.missing_primary}")
    print(f"  missing_document: {summary.missing_document}")
    print(f"  copied_to_primary: {summary.copied_to_primary}")
    print(f"  deleted_legacy: {summary.deleted_legacy}")
    print(f"  skipped: {summary.skipped}")
    print(f"  errors: {summary.errors}")

    if not args.apply:
        print("\nDry-run only. Re-run with --apply to perform changes.")

    return 1 if summary.errors > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
