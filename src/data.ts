import { Trip } from './types';

// 讓範例行程的日期永遠落在天氣預報範圍內（明天開始）
function relativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export const SAMPLE_TRIP: Trip = {
  id: "trip_seoul_2026",
  title: "首爾四天三夜 ☕",
  coverImage: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&q=80&w=1000",
  destination: "Seoul, Korea",
  startDate: relativeDate(1),
  endDate: relativeDate(4),
  participants: [
    { id: 'p1', name: '我', emoji: '🐱', color: '#FFACBB' },
    { id: 'p2', name: '小美', emoji: '🐰', color: '#AAB6FB' },
    { id: 'p3', name: '阿強', emoji: '🐻', color: '#99F2E6' },
  ],
  expenses: [
    {
      id: 'e1',
      title: '景福宮門票',
      amount: 9000,
      currency: 'KRW',
      payerId: 'p1',
      splitWithIds: ['p1', 'p2', 'p3'],
      date: relativeDate(1),
      category: 'attraction'
    },
    {
      id: 'e2',
      title: '韓式烤肉晚餐',
      amount: 75000,
      currency: 'KRW',
      payerId: 'p2',
      splitWithIds: ['p1', 'p2', 'p3'],
      date: relativeDate(1),
      category: 'restaurant'
    }
  ],
  days: [
    {
      dayNumber: 1,
      date: relativeDate(1),
      title: "古宮巡禮 🏯",
      spots: [
        {
          id: "spot_1",
          name: "景福宮",
          nameLocal: "경복궁",
          address: "首爾特別市鍾路區社稷路 161",
          photo: "https://images.unsplash.com/photo-1538669715515-5c3758c07ba9?auto=format&fit=crop&q=80&w=400",
          category: "attraction",
          lat: 37.5796,
          lng: 126.9770,
          duration: 120,
          cost: 3000,
          currency: "KRW",
          notes: "建議穿韓服免費入場！光化門守衛交接 10:00/14:00",
          tags: ["#宮殿", "#韓服", "#歷史"],
          openingHours: "09:00-18:00",
          rating: 4.6,
          order: 0
        },
        {
          id: "spot_2",
          name: "北村韓屋村",
          nameLocal: "북촌한옥마을",
          address: "首爾特別市鍾路區桂洞街 37",
          photo: "https://images.unsplash.com/photo-1578469645742-46cae010e5d4?auto=format&fit=crop&q=80&w=400",
          category: "attraction",
          lat: 37.5824,
          lng: 126.9850,
          duration: 90,
          cost: 0,
          currency: "KRW",
          notes: "安靜散步，注意不要打擾居民",
          tags: ["#韓屋", "#拍照", "#散步"],
          openingHours: "全天開放",
          rating: 4.3,
          order: 1
        },
        {
          id: "spot_3",
          name: "On Ne Sait Jamais",
          nameLocal: "옹느세자매",
          address: "首爾特別市龍山區梨泰院路54街51",
          photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400",
          category: "cafe",
          lat: 37.5365,
          lng: 127.0012,
          duration: 60,
          cost: 12000,
          currency: "KRW",
          notes: "澡堂風格咖啡廳，蒙布朗很有名！",
          tags: ["#咖啡廳", "#甜點", "#特色"],
          openingHours: "11:00-21:00",
          rating: 4.5,
          order: 2
        }
      ],
      transits: [
        {
          id: "transit_1_2",
          fromSpotId: "spot_1",
          toSpotId: "spot_2",
          selectedMode: "walking",
          estimates: {
            "walking": {
              "duration": 15,
              "distance": 1100,
              "description": "沿三清洞路步行，沿途有很多咖啡廳"
            },
            "bus": {
              "duration": 8,
              "distance": 1300,
              "cost": 1400,
              "description": "搭乘 11 號公車"
            },
            "taxi": {
              "duration": 5,
              "distance": 1200,
              "cost": 4800,
              "description": "基本車資"
            }
          }
        },
        {
          id: "transit_2_3",
          fromSpotId: "spot_2",
          toSpotId: "spot_3",
          selectedMode: "subway",
          estimates: {
            "subway": {
              "duration": 25,
              "distance": 4500,
              "cost": 1400,
              "description": "安國站 → 漢江鎮站"
            },
            "taxi": {
              "duration": 15,
              "distance": 4200,
              "cost": 8500,
              "description": "約 15 分鐘車程"
            }
          }
        }
      ]
    },
    {
      dayNumber: 2,
      date: relativeDate(2),
      title: "弘大 & 明洞 🛍️",
      spots: [
        {
          id: "spot_4",
          name: "弘大街頭",
          nameLocal: "홍대거리",
          address: "首爾特別市麻浦區臥牛山路 일대",
          photo: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=400",
          category: "shopping",
          lat: 37.5563,
          lng: 126.9236,
          duration: 120,
          cost: 0,
          currency: "KRW",
          notes: "週末有街頭表演，夜晚氣氛最好！",
          tags: ["#弘大", "#街頭藝術", "#購物"],
          openingHours: "全天開放",
          rating: 4.4,
          order: 0
        },
        {
          id: "spot_5",
          name: "明洞商圈",
          nameLocal: "명동",
          address: "首爾特別市中區明洞 일대",
          photo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=400",
          category: "shopping",
          lat: 37.5636,
          lng: 126.9869,
          duration: 150,
          cost: 0,
          currency: "KRW",
          notes: "韓國美妝聖地，路邊小吃必試雞蛋糕！",
          tags: ["#明洞", "#美妝", "#小吃"],
          openingHours: "10:00-22:00",
          rating: 4.2,
          order: 1
        }
      ],
      transits: [
        {
          id: "transit_4_5",
          fromSpotId: "spot_4",
          toSpotId: "spot_5",
          selectedMode: "subway",
          estimates: {
            "subway": {
              "duration": 20,
              "distance": 5200,
              "cost": 1400,
              "description": "弘大入口站 → 明洞站"
            },
            "taxi": {
              "duration": 18,
              "distance": 5000,
              "cost": 10000,
              "description": "約 18 分鐘車程"
            }
          }
        }
      ]
    },
    {
      dayNumber: 3,
      date: relativeDate(3),
      title: "漢江 & 樂天世界 🎡",
      spots: [
        {
          id: "spot_6",
          name: "漢江公園 汝矣島",
          nameLocal: "여의도 한강공원",
          address: "首爾特別市永登浦區汝矣公園路 68",
          photo: "https://images.unsplash.com/photo-1617541086271-4d43983704bd?auto=format&fit=crop&q=80&w=400",
          category: "attraction",
          lat: 37.5286,
          lng: 126.9326,
          duration: 90,
          cost: 0,
          currency: "KRW",
          notes: "五月有漢江煙火節，傍晚景色超美！",
          tags: ["#漢江", "#野餐", "#夜景"],
          openingHours: "全天開放",
          rating: 4.5,
          order: 0
        },
        {
          id: "spot_7",
          name: "樂天世界",
          nameLocal: "롯데월드",
          address: "首爾特別市松坡區奧林匹克路 240",
          photo: "https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&q=80&w=400",
          category: "activity",
          lat: 37.5113,
          lng: 127.0982,
          duration: 240,
          cost: 62000,
          currency: "KRW",
          notes: "室內外結合樂園，下雨天也能玩！",
          tags: ["#樂天世界", "#遊樂園", "#室內"],
          openingHours: "10:30-21:00",
          rating: 4.3,
          order: 1
        }
      ],
      transits: [
        {
          id: "transit_6_7",
          fromSpotId: "spot_6",
          toSpotId: "spot_7",
          selectedMode: "subway",
          estimates: {
            "subway": {
              "duration": 35,
              "distance": 11000,
              "cost": 1500,
              "description": "汝矣渡口站 → 蠶室站"
            },
            "taxi": {
              "duration": 30,
              "distance": 10500,
              "cost": 18000,
              "description": "約 30 分鐘車程"
            }
          }
        }
      ]
    },
    {
      dayNumber: 4,
      date: relativeDate(4),
      title: "仁寺洞 & 返程 ✈️",
      spots: [
        {
          id: "spot_8",
          name: "仁寺洞",
          nameLocal: "인사동",
          address: "首爾特別市鍾路區仁寺洞街",
          photo: "https://images.unsplash.com/photo-1583394293214-cca9f2b9f4e4?auto=format&fit=crop&q=80&w=400",
          category: "shopping",
          lat: 37.5741,
          lng: 126.9852,
          duration: 90,
          cost: 0,
          currency: "KRW",
          notes: "傳統工藝品與藝廊聚集地，適合帶伴手禮",
          tags: ["#仁寺洞", "#傳統", "#伴手禮"],
          openingHours: "10:00-21:00",
          rating: 4.1,
          order: 0
        }
      ],
      transits: []
    }
  ]
};
