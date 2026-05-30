import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { bookmarksApi, usersApi } from "../api";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, ready } = useAuth();
  const { i18n } = useTranslation();
  // Keys are "${eventId}-${sessionId}" where sessionId=0 means whole-event.
  const [bookmarkedEventKeys, setBookmarkedEventKeys] = useState(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState(new Set());
  const [drafts, setDrafts] = useState([]);

  // User-specific: load bookmarks + drafts on login, clear on logout
  const refreshUserData = useCallback(async () => {
    if (!user) {
      setBookmarkedEventKeys(new Set());
      setBookmarkedPostIds(new Set());
      setDrafts([]);
      return;
    }
    try {
      const [bEvents, bPosts, ds] = await Promise.all([
        bookmarksApi.myEvents(),
        bookmarksApi.myPosts(),
        usersApi.myDrafts(),
      ]);
      setBookmarkedEventKeys(new Set(bEvents.map((e) => `${e.id}-${e._bookmarkedSessionId ?? 0}`)));
      setBookmarkedPostIds(new Set(bPosts.map((p) => p.id)));
      setDrafts(ds);
    } catch (err) {
      // Surface the failure so stale UI doesn't masquerade as fresh data.
      // We don't clear existing state — better to show stale than empty —
      // but we log so devs notice and can wire a toast later.
      // eslint-disable-next-line no-console
      console.error("[DataContext] refreshUserData failed:", err);
    }
  }, [user, i18n.language]);

  useEffect(() => {
    // Wait for AuthProvider to finish restoring session — otherwise we'd
    // first run with user=null (clearing state) and then re-run after /me
    // resolves, causing a flash of empty bookmarks.
    if (!ready) return;
    refreshUserData();
  }, [ready, refreshUserData]);

  const toggleEventBookmark = async (eventId, sessionId = 0) => {
    if (!user) return;
    const key = `${eventId}-${sessionId}`;
    const isOn = bookmarkedEventKeys.has(key);
    try {
      const r = isOn
        ? await bookmarksApi.unbookmarkEvent(eventId, sessionId)
        : await bookmarksApi.bookmarkEvent(eventId, sessionId);
      setBookmarkedEventKeys((prev) => {
        const next = new Set(prev);
        if (r.bookmarked) next.add(key);
        else next.delete(key);
        return next;
      });
    } catch { /* keep current state on failure */ }
  };

  const isEventBookmarked = (eventId, sessionId = 0) =>
    bookmarkedEventKeys.has(`${eventId}-${sessionId}`);
  const isPostBookmarked = (id) => bookmarkedPostIds.has(id);

  const value = {
    bookmarkedEventKeys,
    bookmarkedPostIds,
    drafts,
    toggleEventBookmark,
    isEventBookmarked,
    isPostBookmarked,
    refreshUserData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
