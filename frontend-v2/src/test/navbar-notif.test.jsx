import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// --- Mocks -----------------------------------------------------------------
// i18n: return the key verbatim so we don't depend on translation files.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: "zh-TW" } }),
}));

// LocaleSwitcher pulls in i18n machinery we don't need here.
vi.mock("../components/LocaleSwitcher", () => ({ default: () => null }));

// Auth: a logged-in user (id=1).
const mockUser = { id: 1, name: "Me", email: "me@ntu.edu", isAdmin: false, avatarUrl: "" };
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn() }),
}));

// API: notification data sources.
const myRegistrations = vi.fn();
const postsList = vi.fn();
vi.mock("../api", () => ({
  usersApi: { myRegistrations: () => myRegistrations() },
  postsApi: { list: (params) => postsList(params) },
}));

import Navbar from "../components/Navbar";

const NOTIF_SEEN_KEY = "ntu_notif_last_seen";

function isoInDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function groupPost(id) {
  return { id, userId: 999, title: `Post${id}`, content: "body", createdAt: "2026-05-20", isBoardPost: true };
}

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

function badgeEl(container) {
  return container.querySelector(".MuiBadge-badge");
}

// MUI keeps the previous badgeContent text during the hide transition, so
// visibility is determined by the `MuiBadge-invisible` class, not textContent.
function badgeHidden(container) {
  return !!badgeEl(container)?.classList.contains("MuiBadge-invisible");
}

function bellButton(container) {
  return container.querySelector(".MuiBadge-root").closest("button");
}

beforeAll(() => {
  // jsdom in this Node version doesn't wire localStorage; provide an in-memory one.
  const store = new Map();
  const ls = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  globalThis.localStorage = ls;
  window.localStorage = ls;

  // MUI useMediaQuery needs matchMedia; force desktop (matches:false) so the bell renders.
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
});

beforeEach(() => {
  cleanup();
  localStorage.clear();
  // Default: 1 upcoming registration + 2 group posts => 3 notifications.
  myRegistrations.mockResolvedValue([
    { id: 101, event_id: 7, event_title: "AlphaEvent", date: isoInDays(2), status: "success", location: "RoomA" },
  ]);
  postsList.mockResolvedValue([groupPost(201), groupPost(202)]);
});

describe("Navbar notification badge", () => {
  it("shows the unread count before the user views the panel", async () => {
    const { container } = renderNavbar();
    await waitFor(() => expect(badgeEl(container)?.textContent).toBe("3"));
    expect(badgeHidden(container)).toBe(false);
  });

  it("clears the badge once the user opens (views) the notification panel", async () => {
    const { container } = renderNavbar();
    await waitFor(() => expect(badgeEl(container)?.textContent).toBe("3"));
    expect(badgeHidden(container)).toBe(false);

    // Open the bell == the user has now viewed the notifications.
    fireEvent.click(bellButton(container));

    // Badge must become invisible (count -> 0).
    await waitFor(() => expect(badgeHidden(container)).toBe(true));
  });

  it("re-shows only the NEW unread delta after viewing, not the full total", async () => {
    // First mount: view 3 notifications so they are marked seen.
    const first = renderNavbar();
    await waitFor(() => expect(badgeEl(first.container)?.textContent).toBe("3"));
    fireEvent.click(bellButton(first.container));
    await waitFor(() => expect(badgeHidden(first.container)).toBe(true));
    first.unmount();

    // A new group post arrives -> total becomes 4 (1 reg + 3 posts).
    postsList.mockResolvedValue([groupPost(201), groupPost(202), groupPost(203)]);

    // Remount (e.g. page reload): only the 1 new item should be badged.
    const second = renderNavbar();
    await waitFor(() => {
      expect(badgeEl(second.container)?.textContent).toBe("1");
      expect(badgeHidden(second.container)).toBe(false);
    });
  });
});
