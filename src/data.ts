import { Trip } from './types';

export const SAMPLE_TRIP: Trip = {
  id: "trip_seoul_2026",
  title: "首爾四天三夜 ☕",
  coverImage: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&q=80&w=1000",
  destination: "Seoul, Korea",
  startDate: "2026-05-01",
  endDate: "2026-05-04",
  participants: [
    { id: 'p1', name: '我', emoji: '🐱', color: '#BF8445' },
    { id: 'p2', name: '小美', emoji: '🐰', color: '#D49D8F' },
    { id: 'p3', name: '阿強', emoji: '🐻', color: '#A67B5B' },
  ],
  expenses: [
    {
      id: 'e1',
      title: '景福宮門票',
      amount: 9000,
      currency: 'KRW',
      payerId: 'p1',
      splitWithIds: ['p1', 'p2', 'p3'],
      date: '2026-05-01',
      category: 'attraction'
    },
    {
      id: 'e2',
      title: '韓式烤肉晚餐',
      amount: 75000,
      currency: 'KRW',
      payerId: 'p2',
      splitWithIds: ['p1', 'p2', 'p3'],
      date: '2026-05-01',
      category: 'restaurant'
    }
  ],
  days: [
    {
      dayNumber: 1,
      date: "2026-05-01",
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
          order: 1
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
          order: 2
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
          order: 3
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
    }
  ]
};
