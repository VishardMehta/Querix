from __future__ import annotations

import os
from functools import lru_cache
from typing import Any
from urllib.parse import quote

import httpx
from fastapi.encoders import jsonable_encoder


DEFAULT_EMAIL = os.getenv("QUERIX_PROFILE_EMAIL", "admin@talktodata.app")
DEFAULT_PROFILE = {
    "display_name": "System Admin",
    "email": DEFAULT_EMAIL,
    "agent_name": "AGENT_01",
    "avatar_url": None,
}


class SupabaseStore:
    def __init__(self) -> None:
        self.url = (os.getenv("SUPABASE_URL") or "").rstrip("/")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
        self.enabled = bool(self.url and self.key)
        self.timeout = httpx.Timeout(8.0, connect=4.0)

    @property
    def base_url(self) -> str:
        return f"{self.url}/rest/v1"

    @property
    def headers(self) -> dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, *, json: Any | None = None, prefer: str | None = None) -> Any | None:
        if not self.enabled:
            return None
        headers = dict(self.headers)
        if prefer:
            headers["Prefer"] = prefer
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.request(method, f"{self.base_url}{path}", headers=headers, json=jsonable_encoder(json))
                response.raise_for_status()
                if not response.content:
                    return None
                return response.json()
        except Exception as exc:
            print(f"[supabase] {method} {path} failed: {exc}")
            return None

    def get_profile(self) -> dict[str, Any]:
        if not self.enabled:
            return dict(DEFAULT_PROFILE)
        rows = self._request("GET", f"/profiles?email=eq.{quote(DEFAULT_EMAIL)}&limit=1")
        if isinstance(rows, list) and rows:
            return rows[0]
        created = self._request("POST", "/profiles", json=DEFAULT_PROFILE, prefer="return=representation")
        if isinstance(created, list) and created:
            return created[0]
        return dict(DEFAULT_PROFILE)

    def save_profile(self, profile: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "display_name": profile.get("display_name") or profile.get("displayName") or DEFAULT_PROFILE["display_name"],
            "email": profile.get("email") or DEFAULT_EMAIL,
            "agent_name": profile.get("agent_name") or profile.get("agentName") or DEFAULT_PROFILE["agent_name"],
            "avatar_url": profile.get("avatar_url") or profile.get("avatarUrl"),
        }
        if not self.enabled:
            return payload

        current = self.get_profile()
        profile_id = current.get("id")
        if profile_id:
            updated = self._request(
                "PATCH",
                f"/profiles?id=eq.{profile_id}",
                json=payload,
                prefer="return=representation",
            )
            if isinstance(updated, list) and updated:
                return updated[0]

        created = self._request("POST", "/profiles", json=payload, prefer="return=representation")
        if isinstance(created, list) and created:
            return created[0]
        return payload

    def ensure_session(self, client_session_id: str, title: str = "Untitled session", dataset_id: str | None = None) -> dict[str, Any] | None:
        if not self.enabled or not client_session_id:
            return None
        rows = self._request("GET", f"/chat_sessions?client_session_id=eq.{client_session_id}&limit=1")
        if isinstance(rows, list) and rows:
            return rows[0]

        profile = self.get_profile()
        payload = {
            "client_session_id": client_session_id,
            "owner_id": profile.get("id"),
            "dataset_id": dataset_id,
            "title": title[:160] if title else "Untitled session",
        }
        created = self._request("POST", "/chat_sessions", json=payload, prefer="return=representation")
        if isinstance(created, list) and created:
            return created[0]
        return None

    def insert_datasets(self, client_session_id: str, tables: list[dict[str, Any]], source_type: str = "csv") -> list[dict[str, Any]]:
        if not self.enabled or not tables:
            return []
        session = self.ensure_session(client_session_id, title=tables[0].get("filename") or "Dataset session")
        profile = self.get_profile()
        payload = [
            {
                "owner_id": profile.get("id"),
                "client_session_id": client_session_id,
                "file_name": table.get("filename") or table.get("name") or "dataset",
                "table_name": table.get("name") or "dataset",
                "source_type": source_type,
                "row_count": table.get("rows") or 0,
                "column_count": table.get("columns") or 0,
                "metadata": {"reused": bool(table.get("reused"))},
            }
            for table in tables
        ]
        created = self._request("POST", "/datasets", json=payload, prefer="return=representation")
        if isinstance(created, list) and created and session and not session.get("dataset_id"):
            self._request("PATCH", f"/chat_sessions?id=eq.{session['id']}", json={"dataset_id": created[0].get("id")})
        return created if isinstance(created, list) else []

    def store_query_result(self, client_session_id: str, question: str, query_result: dict[str, Any]) -> None:
        if not self.enabled:
            return
        session = self.ensure_session(client_session_id, title=question[:120] or "Query session")
        if not session:
            return
        session_id = session["id"]
        self._request("POST", "/chat_messages", json={
            "session_id": session_id,
            "role": "user",
            "content": question,
        })
        self._request("POST", "/chat_messages", json={
            "session_id": session_id,
            "role": "assistant",
            "content": query_result.get("answer") or "",
            "query_result": query_result,
        })
        self._request("POST", "/query_runs", json={
            "session_id": session_id,
            "dataset_id": session.get("dataset_id"),
            "question": question,
            "sql": query_result.get("sql"),
            "answer": query_result.get("answer"),
            "chart_payload": {
                key: query_result.get(key)
                for key in ("chart_type", "data", "x_key", "y_key", "name_key", "value_key", "columns", "rows")
                if query_result.get(key) is not None
            },
            "confidence": query_result.get("confidence"),
            "timings": query_result.get("debug_timings") or {},
        })


@lru_cache(maxsize=1)
def get_store() -> SupabaseStore:
    return SupabaseStore()
