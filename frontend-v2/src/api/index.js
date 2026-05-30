import api from "./client";
import i18n from "../i18n";


// Map i18next language code (zh-TW / en / en-US ...) to the 2-char `lang`
// query the backend events API expects.
function currentLang() {
  const code = (i18n.language || "").toLowerCase();
  return code.startsWith("en") ? "en" : "zh";
}


// ---------- mappers: backend snake_case -> frontend camelCase ----------
function mapEvent(e) {
  if (!e) return e;
  const firstSession = (e.sessions && e.sessions[0]) || {};
  const mealText = (firstSession.meal || "").trim();
  const mealProvided = !!mealText && !/不提供|無|沒有|none|no meal/i.test(mealText);
  return {
    id: e.id,
    title: e.title,
    content: e.content || "",
    activityContent: e.content || "",
    category: e.category || "活動",
    officialCategory: e.official_category || null,
    image: resolveUrl(e.image_url) || "/default-event.svg",
    organizer: e.organizer || "",
    organizerContact: e.organizer_contact || "",
    contactPhone: e.contact_phone || "",
    contactEmail: e.contact_email || "",
    registrationType: e.registration_type || "",
    registrationFee: e.registration_fee || "",
    targetAudience: e.target_audience || "",
    learningCategory: e.learning_category || "",
    tags: e.tags || [],
    // session-derived for backwards compat with existing UI
    date: firstSession.date || "",
    time: firstSession.time_range || "",
    location: firstSession.location || "",
    instructor: firstSession.instructor || "",
    capacity: firstSession.capacity ?? 0,
    remainingSlots: firstSession.remaining_slots ?? 0,
    registrationStart: firstSession.registration_start || "",
    registrationEnd: firstSession.registration_end || "",
    sessionName: firstSession.session_name || "",
    meal: mealText,
    mealProvided,
    sessions: e.sessions || [],
    rating: 0,
    reviewCount: 0,
  };
}

const getBaseUrl = () => {
  const base = api.defaults.baseURL || "";
  return base.replace(/\/api\/?$/, "");
};

function resolveUrl(url) {
  if (!url) return url;
  return /^(https?:|data:)/i.test(url) ? url : `${getBaseUrl()}${url}`;
}

function avatarFor(userId, avatarPath) {
  if (avatarPath && String(avatarPath).trim() !== "") {
    return resolveUrl(avatarPath);
  }
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`;
}

function mapPost(p) {
  if (!p) return null;
  return {
    ...p,
    title: p.title || "",
    userId: p.user_id,
    eventId: p.event_id ?? null,
    eventTitle: p.event_title || "",
    eventOfficialCategory: p.event_official_category || null,
    groupId: p.group_id || null,
    groupName: p.group_name || null,
    isBoardPost: !!p.is_board_post,
    likeCount: p.like_count ?? 0,
    bookmarkCount: p.bookmark_count ?? 0,
    commentCount: p.comment_count ?? 0,
    isLiked: !!p.is_liked,
    isBookmarked: !!p.is_bookmarked,
    images: (p.images || []).map(resolveUrl),
    createdAt: p.created_at || "",
    updatedAt: p.updated_at || "",
    userName: p.user_name || `User #${p.user_id}`,
    userAvatar: avatarFor(p.user_id, p.user_avatar),
    comments: (p.comments || []).map((c) => ({
      ...c,
      userId: c.user_id,
      postId: c.post_id ?? null,
      createdAt: c.created_at || "",
      userName: c.user_name || `User #${c.user_id}`,
      userAvatar: avatarFor(c.user_id, c.user_avatar),
    })),
  };
}

function mapUser(u) {
  if (!u) return null;
  // Upload backend generates unique filenames (secrets.token_hex), so the URL
  // itself acts as the cache-bust key. Adding `?t=Date.now()` would force every
  // page load to re-fetch the image (and risks being dropped by CDNs that
  // strip query strings) — it doesn't help avatar update propagation.
  return {
    ...u,
    isAdmin: !!u.is_admin,
    studentId: u.student_id,
    avatarUrl: u.avatar_url
      ? resolveUrl(u.avatar_url)
      : `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.id}`,
  };
}

function mapGroup(g) {
  if (!g) return null;
  return {
    id: g.id,
    name: g.name,
    ownerId: g.owner_id,
    memberCount: g.member_count ?? 0,
    postCount: g.post_count ?? 0,
    createdAt: g.created_at,
    members: (g.members || []).map((m) => ({
      userId: m.user_id,
      userName: m.user_name,
      userEmail: m.user_email,
      userAvatar: avatarFor(m.user_id, m.user_avatar),
      joinedAt: m.joined_at,
    })),
    invitations: (g.invitations || []).map((i) => ({
      id: i.id,
      email: i.email,
      status: i.status,
      createdAt: i.created_at,
    })),
  };
}


// ---------- endpoints ----------
export const authApi = {
  register: (name, email, password) =>
    api.post("/api/auth/register", { name, email, password }).then((r) => {
      const data = r.data;
      if (data.user) data.user = mapUser(data.user);
      return data;
    }),
  login: (email, password) =>
    api.post("/api/auth/login", { email, password }).then((r) => {
      const data = r.data;
      if (data.user) data.user = mapUser(data.user);
      return data;
    }),
  me: () => api.get("/api/auth/me").then((r) => mapUser(r.data)),
  googleLogin: (credential) =>
    api.post("/api/auth/google", { credential }).then((r) => {
      const data = r.data;
      if (data.user) data.user = mapUser(data.user);
      return data;
    }),
  forgotPassword: (email) =>
    api.post("/api/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (token, newPassword) =>
    api.post("/api/auth/reset-password", { token, new_password: newPassword }).then((r) => r.data),
};

export const eventsApi = {
  list: async (params = {}) => {
    const { data } = await api.get("/api/events", {
      params: { lang: currentLang(), ...params },
    });
    return { ...data, items: data.items.map(mapEvent) };
  },
  get: async (id) => {
    const { data } = await api.get(`/api/events/${id}`, {
      params: { lang: currentLang() },
    });
    return mapEvent(data);
  },
  create: async (payload) => {
    const { data } = await api.post("/api/events", payload);
    return mapEvent(data);
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/api/events/${id}`, payload);
    return mapEvent(data);
  },
  registrations: async (id) => {
    const { data } = await api.get(`/api/events/${id}/registrations`);
    return data; // [{ registration_id, user_name, user_email, student_id, department, session_id, session_name, status, registered_at }]
  },
  categories: async () => {
    const { data } = await api.get("/api/events/categories", {
      params: { lang: currentLang() },
    });
    return data;
  },
  tags: async () => {
    const { data } = await api.get("/api/events/tags");
    return data; // [{name, count}]
  },
};

export const postsApi = {
  list: async (params = {}) => {
    const { data } = await api.get("/api/posts", { params: { lang: currentLang(), ...params } });
    return data.map(mapPost);
  },
  get: async (id) => {
    const { data } = await api.get(`/api/posts/${id}`);
    return mapPost(data);
  },
  create: (payload) => api.post("/api/posts", payload).then((r) => mapPost(r.data)),
  update: (id, payload) => api.patch(`/api/posts/${id}`, payload).then((r) => mapPost(r.data)),
  remove: (id) => api.delete(`/api/posts/${id}`),
  addComment: (postId, content) =>
    api.post(`/api/posts/${postId}/comments`, { content }).then((r) => r.data),
  // like/bookmark return { liked|bookmarked, like_count|bookmark_count } so
  // consumers can replace optimistic counts with server truth (idempotent).
  like: (id) => api.post(`/api/posts/${id}/like`).then((r) => r.data),
  unlike: (id) => api.delete(`/api/posts/${id}/like`).then((r) => r.data),
  bookmark: (id) => api.post(`/api/posts/${id}/bookmark`).then((r) => r.data),
  unbookmark: (id) => api.delete(`/api/posts/${id}/bookmark`).then((r) => r.data),
};

// Board API: thin sugar over postsApi for the 留言板 surfaces.
export const boardApi = {
  list: (params = {}) => postsApi.list({ is_board_post: true, ...params }),
  hot: (params = {}) => postsApi.list({ is_board_post: true, tab: "hot", ...params }),
  new: (params = {}) => postsApi.list({ is_board_post: true, tab: "new", ...params }),
  mine: (params = {}) => postsApi.list({ is_board_post: true, tab: "mine", ...params }),
  bookmarked: (params = {}) => postsApi.list({ is_board_post: true, tab: "bookmarked", ...params }),
  privateOnly: (params = {}) => postsApi.list({ is_board_post: true, tab: "private", ...params }),
  byGroup: (groupId, params = {}) => postsApi.list({ is_board_post: true, group_id: groupId, ...params }),
};

export const bookmarksApi = {
  myEvents: async () => {
    const { data } = await api.get("/api/users/me/bookmarks/events");
    // Each item: { bookmarked_session_id, event }. Map to a flat event object
    // with _bookmarkedSessionId so callers can display the right session.
    return data.map(({ bookmarked_session_id, event }) => {
      const ev = mapEvent(event);
      ev._bookmarkedSessionId = bookmarked_session_id;
      if (bookmarked_session_id) {
        const sess = (event.sessions || []).find((s) => s.id === bookmarked_session_id);
        if (sess) {
          ev.date = sess.date || ev.date;
          ev.time = sess.time_range || ev.time;
          ev.location = sess.location || ev.location;
          ev.sessionName = sess.session_name || ev.sessionName;
          ev._matchedSessionId = sess.id;
        }
      }
      return ev;
    });
  },
  myPosts: async () => {
    const { data } = await api.get("/api/users/me/bookmarks/posts");
    return data.map(mapPost);
  },
  // session_id = 0 means whole-event bookmark; non-zero = specific session.
  bookmarkEvent: (id, sessionId = 0) =>
    api.post(`/api/events/${id}/bookmark`, { session_id: sessionId }).then((r) => r.data),
  unbookmarkEvent: (id, sessionId = 0) =>
    api.delete(`/api/events/${id}/bookmark`, { params: { session_id: sessionId } }).then((r) => r.data),
};

function mapMyComment(c) {
  if (!c) return null;
  return {
    id: c.id,
    content: c.content,
    createdAt: c.created_at,
    postId: c.post_id,
    postTitle: c.post_title,
    postExcerpt: c.post_excerpt || "",
    postIsBoardPost: !!c.post_is_board_post,
    postEventId: c.post_event_id,
    postEventTitle: c.post_event_title,
  };
}

export const usersApi = {
  get: (id) => api.get(`/api/users/${id}`).then((r) => mapUser(r.data)),
  updateMe: (payload) => api.patch("/api/users/me", payload).then((r) => mapUser(r.data)),
  myDrafts: async () => {
    const { data } = await api.get("/api/users/me/drafts");
    return data.map(mapPost);
  },
  myRegistrations: () => api.get("/api/users/me/registrations", { params: { lang: currentLang() } }).then((r) =>
    r.data.map((reg) => ({ ...reg, event_image: resolveUrl(reg.event_image) }))
  ),
  myComments: async () => {
    const { data } = await api.get("/api/users/me/comments", { params: { lang: currentLang() } });
    return data.map(mapMyComment);
  },
  managedEvents: async (params = {}) => {
    const { data } = await api.get("/api/users/me/managed_events", { params: { lang: currentLang(), ...params } });
    return { ...data, items: (data.items || []).map(mapEvent) };
  },
};

export const commentsApi = {
  update: (id, content) => api.patch(`/api/comments/${id}`, { content }).then((r) => r.data),
  remove: (id) => api.delete(`/api/comments/${id}`),
};

export const uploadsApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
};

export const groupsApi = {
  listMine: async () => {
    const { data } = await api.get("/api/groups");
    return data.map(mapGroup);
  },
  get: (id) => api.get(`/api/groups/${id}`).then((r) => mapGroup(r.data)),
  create: (payload) => api.post("/api/groups", payload).then((r) => mapGroup(r.data)),
  update: (id, payload) => api.patch(`/api/groups/${id}`, payload).then((r) => mapGroup(r.data)),
  remove: (id) => api.delete(`/api/groups/${id}`),
  invite: (id, email) => api.post(`/api/groups/${id}/invite`, { email }).then((r) => r.data),
  removeMember: (id, userId) => api.delete(`/api/groups/${id}/members/${userId}`),
  revokeInvite: (id, inviteId) => api.delete(`/api/groups/${id}/invitations/${inviteId}`),
};

export { mapEvent, mapPost, mapUser, mapGroup, resolveUrl };
