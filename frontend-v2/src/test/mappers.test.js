import { describe, it, expect } from "vitest";
import { mapEvent, mapPost } from "../api";

describe("mapEvent", () => {
  it("flattens first session into top-level fields", () => {
    const e = mapEvent({
      id: 1,
      title: "T",
      image_url: "img",
      organizer: "O",
      sessions: [
        { date: "2026-06-01", time_range: "10:00", location: "L",
          capacity: 30, remaining_slots: 5, session_name: "S1" },
        { date: "2026-06-02" },
      ],
    });
    expect(e.id).toBe(1);
    expect(e.title).toBe("T");
    expect(e.image).toBe("img");
    expect(e.date).toBe("2026-06-01");
    expect(e.time).toBe("10:00");
    expect(e.location).toBe("L");
    expect(e.capacity).toBe(30);
    expect(e.remainingSlots).toBe(5);
    expect(e.sessionName).toBe("S1");
    expect(e.sessions).toHaveLength(2);
  });

  it("handles event with no sessions", () => {
    const e = mapEvent({ id: 2, title: "T" });
    expect(e.date).toBe("");
    expect(e.location).toBe("");
    expect(e.capacity).toBe(0);
    expect(e.sessions).toEqual([]);
  });

  it("returns null/undefined as-is", () => {
    expect(mapEvent(null)).toBe(null);
    expect(mapEvent(undefined)).toBe(undefined);
  });
});

describe("mapPost", () => {
  it("converts snake_case to camelCase", () => {
    const p = mapPost({
      id: 5,
      user_id: 7,
      event_id: 9,
      rating: 4,
      content: "hi",
      images: ["a"],
      visibility: "public",
      created_at: "2026-04-01T00:00:00Z",
      like_count: 3,
      is_liked: true,
      is_bookmarked: false,
      comments: [{ id: 1, content: "ok" }],
    });
    expect(p.userId).toBe(7);
    expect(p.eventId).toBe(9);
    expect(p.likeCount).toBe(3);
    expect(p.isLiked).toBe(true);
    expect(p.isBookmarked).toBe(false);
    expect(p.createdAt).toBe("2026-04-01T00:00:00Z");
    expect(p.comments).toHaveLength(1);
  });

  it("supplies safe defaults for missing fields", () => {
    const p = mapPost({ id: 1, user_id: 2, content: "x" });
    expect(p.images).toEqual([]);
    expect(p.likeCount).toBe(0);
    expect(p.isLiked).toBe(false);
    expect(p.isBookmarked).toBe(false);
    expect(p.comments).toEqual([]);
  });
});
