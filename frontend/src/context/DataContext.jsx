import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { bookmarksApi, usersApi } from "../api";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, ready } = useAuth();
  const [bookmarkedEventIds, setBookmarkedEventIds] = useState(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState(new Set());
  const [drafts, setDrafts] = useState([]);

  // User-specific: load bookmarks + drafts on login, clear on logout
  const refreshUserData = useCallback(async () => {
    if (!user) {
      setBookmarkedEventIds(new Set());
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
      setBookmarkedEventIds(new Set(bEvents.map((e) => e.id)));
      setBookmarkedPostIds(new Set(bPosts.map((p) => p.id)));
      setDrafts(ds);
    } catch (err) {
      // Surface the failure so stale UI doesn't masquerade as fresh data.
      // We don't clear existing state — better to show stale than empty —
      // but we log so devs notice and can wire a toast later.
      // eslint-disable-next-line no-console
      console.error("[DataContext] refreshUserData failed:", err);
    }
  }, [user]);

  useEffect(() => {
    // Wait for AuthProvider to finish restoring session — otherwise we'd
    // first run with user=null (clearing state) and then re-run after /me
    // resolves, causing a flash of empty bookmarks.
    if (!ready) return;
    refreshUserData();
  }, [ready, refreshUserData]);

  const toggleEventBookmark = async (eventId) => {
    if (!user) return;
    const prev = bookmarkedEventIds;
    const isOn = prev.has(eventId);
    const next = new Set(prev);
    if (isOn) next.delete(eventId);
    else next.add(eventId);
    setBookmarkedEventIds(next);
    try {
      if (isOn) await bookmarksApi.unbookmarkEvent(eventId);
      else await bookmarksApi.bookmarkEvent(eventId);
    } catch {
      // revert on failure — must be a NEW Set so React sees a different ref
      setBookmarkedEventIds(new Set(prev));
    }
  };

  const isEventBookmarked = (id) => bookmarkedEventIds.has(id);
  const isPostBookmarked = (id) => bookmarkedPostIds.has(id);

  const value = {
    bookmarkedEventIds,
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
