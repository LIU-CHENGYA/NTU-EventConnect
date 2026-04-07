// Mock data for NTU EventConnect
import generatedEvents from "./events.generated.json";

export const mockUsers = [
  {
    id: 1,
    name: "小豪",
    email: "r14725000@ntu.edu.tw",
    department: "資管所",
    studentId: "r14725000",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
    bio: "熱愛參加各種校園活動的研究生",
    postCount: 5,
    joinedEventCount: 12,
    upcomingEventCount: 3,
    tags: ["講座", "運動", "美食"],
    isAdmin: true,
  },
  {
    id: 2,
    name: "anakin93kk",
    email: "b10611000@ntu.edu.tw",
    department: "資工系",
    studentId: "b10611000",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Anakin",
    bio: "UI/UX 設計愛好者",
    postCount: 3,
    joinedEventCount: 8,
    upcomingEventCount: 1,
    tags: ["求職", "講座"],
    isAdmin: false,
  },
];

export const mockEvents = generatedEvents;


export const mockReviews = [
  {
    id: 1,
    eventId: 1,
    userId: 1,
    userName: "黃宗翰",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
    rating: 5,
    content: "很實用！非常推薦想了解AI跟ML的人來參加～",
    images: [
      "https://images.unsplash.com/photo-1515879218367-8466d910adef?w=400",
    ],
    createdAt: "2026-04-16",
  },
  {
    id: 2,
    eventId: 1,
    userId: 2,
    userName: "anakin93kk",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Anakin",
    rating: 4,
    content: "講師很專業，但進度稍微快了一些。整體來說還是不錯的體驗。不過建議之後可以多一點實作環節。",
    images: [],
    createdAt: "2026-04-16",
  },
  {
    id: 3,
    eventId: 1,
    userId: 1,
    userName: "王小明",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Wang",
    rating: 5,
    content: "在這裡學到很多新東西！已經推薦給我的同學們了，可惜名額有限制。",
    images: [
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400",
    ],
    createdAt: "2026-04-17",
  },
];

export const mockPosts = [
  {
    id: 1,
    userId: 1,
    userName: "小豪",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
    eventId: 1,
    eventTitle: "人工智慧與機器學習實務工作坊",
    rating: 5,
    content: "很實用！非常推薦想了解AI跟ML的人來參加～ 講師很有耐心地解釋每個概念，實作部分也很充實。",
    images: [
      "https://images.unsplash.com/photo-1515879218367-8466d910adef?w=400",
    ],
    visibility: "public",
    createdAt: "2026-04-16",
  },
  {
    id: 2,
    userId: 2,
    userName: "anakin93kk",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Anakin",
    eventId: 2,
    eventTitle: "校園文化藝術節",
    rating: 4,
    content: "今年的藝術節很精彩，尤其是數位藝術展區讓人眼睛為之一亮！",
    images: [
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400",
    ],
    visibility: "public",
    createdAt: "2026-05-02",
  },
];

export const mockRegistrations = [
  {
    id: 1,
    userId: 1,
    eventId: 1,
    eventTitle: "人工智慧與機器學習實務工作坊",
    sessionName: "第一場次",
    eventImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
    registrationTime: "2026-04-02 14:30",
    status: "報名成功",
    date: "2026-04-15",
    location: "台大資工系 A201 階梯教室",
    capacity: 60,
    remainingSlots: 28,
    rating: 4.7,
  },
  {
    id: 2,
    userId: 1,
    eventId: 2,
    eventTitle: "校園文化藝術節",
    sessionName: "開幕式",
    eventImage: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400",
    registrationTime: "2026-04-18 09:15",
    status: "等待候補",
    date: "2026-05-01",
    location: "台大藝文中心",
    capacity: 200,
    remainingSlots: 0,
    rating: 4.7,
  },
  {
    id: 3,
    userId: 1,
    eventId: 3,
    eventTitle: "2026 台大就業博覽會",
    sessionName: "主場次",
    eventImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400",
    registrationTime: "2026-04-25 11:00",
    status: "已取消",
    date: "2026-05-10",
    location: "台大綜合體育館",
    capacity: 500,
    remainingSlots: 320,
    rating: 4.2,
  },
];

export const mockDrafts = [
  {
    id: 1,
    userId: 1,
    eventId: 4,
    eventTitle: "Writing Together 英文寫作營",
    rating: 0,
    content: "草稿：參加心得待補充...",
    images: [],
    visibility: "private",
    createdAt: "2026-05-21",
  },
];

export const mockBookmarkedEvents = [mockEvents[0], mockEvents[1], mockEvents[4]];
export const mockBookmarkedPosts = [mockPosts[0], mockPosts[1]];

export const categories = [
  "全部", "求職", "講座", "運動", "展覽", "Writing together", "有供餐", "工作坊",
];
