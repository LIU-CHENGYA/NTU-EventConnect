import api from "./client";


// ---------- mappers: backend snake_case -> frontend camelCase ----------
function mapEvent(e) {
  if (!e) return e;
  const firstSession = (e.sessions && e.sessions[0]) || {};
  return {
    id: e.id,
    title: e.title,
    content: e.content || "",
    activityContent: e.content || "",
    category: e.category || "活動",
    image: e.image_url,
    organizer: e.organizer || "",
    organizerContact: e.organizer_contact || "",
    contactPhone: e.contact_phone || "",
    contactEmail: e.contact_email || "",
    registrationType: e.registration_type || "",
    registrationFee: e.registration_fee || "",
    targetAudience: e.target_audience || "",
    learningCategory: e.learning_category || "",
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
    meal: firstSession.meal || "",
    sessions: e.sessions || [],
    rating: 0,
    reviewCount: 0,
  };
}

function mapPost(p) {
  if (!p) return null;

  const getAvatar = (userId, avatarPath) => {
    if (avatarPath && avatarPath.trim() !== "") {
      return avatarPath.startsWith('http') ? avatarPath : `http://localhost:8010${avatarPath}`;
    }
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`;
  };

  return {
    ...p,
    userAvatar: getAvatar(p.user_id, p.user_avatar), // 貼文者的頭貼
    comments: (p.comments || []).map((c) => ({
      ...c,
      userName: c.user_name || `User #${c.user_id}`,
      // 關鍵修正：處理留言者的頭貼路徑
      userAvatar: getAvatar(c.user_id, c.user_avatar), 
    })),
  };
}

function getAvatarUrl(userId, avatarPath) {
  if (avatarPath) {
    return avatarPath.startsWith('http') ? avatarPath : `http://localhost:8010${avatarPath}`;
  }
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`;
}

function mapUser(u) {
  if (!u) return null;
  return {
    ...u,
    // 這裡手動建立前端需要的 avatarUrl 欄位
    avatarUrl: u.avatar_url 
      ? (u.avatar_url.startsWith('http') ? u.avatar_url : `http://localhost:8010${u.avatar_url}`)
      : `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.id}`,
  };
}

// ---------- endpoints ----------
export const authApi = {
  // 修正：所有的回應都要加上 .then((r) => mapUser(r.data))
  register: (name, email, password) =>
    api.post("/api/auth/register", { name, email, password }).then((r) => mapUser(r.data.user || r.data)),
  login: (email, password) =>
    api.post("/api/auth/login", { email, password }).then((r) => {
      // 因為 login 回傳結構通常包含 { access_token, user }
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
};

export const eventsApi = {
  list: async (params = {}) => {
    const { data } = await api.get("/api/events", { params });
    return { ...data, items: data.items.map(mapEvent) };
  },
  get: async (id) => {
    const { data } = await api.get(`/api/events/${id}`);
    return mapEvent(data);
  },
  categories: async () => {
    const { data } = await api.get("/api/events/categories");
    return data; // [{name, count}]
  },
};

export const postsApi = {
  list: async (params = {}) => {
    const { data } = await api.get("/api/posts", { params });
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
  like: (id) => api.post(`/api/posts/${id}/like`),
  unlike: (id) => api.delete(`/api/posts/${id}/like`),
  bookmark: (id) => api.post(`/api/posts/${id}/bookmark`),
  unbookmark: (id) => api.delete(`/api/posts/${id}/bookmark`),
};

export const bookmarksApi = {
  myEvents: async () => {
    const { data } = await api.get("/api/users/me/bookmarks/events");
    return data.map(mapEvent);
  },
  myPosts: async () => {
    const { data } = await api.get("/api/users/me/bookmarks/posts");
    return data.map(mapPost);
  },
  bookmarkEvent: (id) => api.post(`/api/events/${id}/bookmark`),
  unbookmarkEvent: (id) => api.delete(`/api/events/${id}/bookmark`),
};

export const usersApi = {
  get: (id) => api.get(`/api/users/${id}`).then((r) => mapUser(r.data)), 
  updateMe: (payload) => api.patch("/api/users/me", payload).then((r) => mapUser(r.data)), 
  myDrafts: async () => {
    const { data } = await api.get("/api/users/me/drafts");
    return data.map(mapPost);
  },
  myRegistrations: () => api.get("/api/users/me/registrations").then((r) => r.data),
};

export const uploadsApi = {
  /**
   * 上傳圖片並回傳網址
   * @param {File} file 
   * @returns {Promise<{url: string}>}
   */
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
};

export { mapEvent, mapPost };
