export const HOTEL_INFO = {
  name: "Hotel Rama Inn",
  tagline: "Seamless Comfort, Light on Pocket",
  address: "Station Road,Englishiya Line, Varanasi, Uttar Pradesh 221002",
  phone: "+91 7376716108",
  email: "ramainn2201@gmail.com",
  checkIn: "11:00 AM",
  checkOut: "12:00 PM",
  rating: 4.9,
  reviewsCount: 342,
};

export const ROOM_CATEGORIES = [
  {
    id: "deluxe-double",
    name: "Deluxe King AC Room",
    slug: "deluxe-king-ac",
    tagline: "Ideal for couples and business travelers",
    basePrice: 2899,
    taxPercent: 12,
    maxAdults: 2,
    maxChildren: 1,
    totalUnits: 10,
    availableUnits: 8,
    bedType: "King Size Bed",
    area: "280 sq.ft",
    amenities: ["Free High-Speed Wi-Fi", "Split AC", "43\" Smart 4K TV", "Tea/Coffee Maker", "Geyser & Premium Toiletries", "Daily Housekeeping"],
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"
    ],
    badge: "Most Popular",
  },
  {
    id: "super-deluxe",
    name: "Super Deluxe Executive Room",
    slug: "super-deluxe-executive",
    tagline: "Spacious luxury with panoramic balcony views",
    basePrice: 3899,
    taxPercent: 12,
    maxAdults: 3,
    maxChildren: 1,
    totalUnits: 8,
    availableUnits: 6,
    bedType: "King Bed + Single Couch",
    area: "360 sq.ft",
    amenities: ["Balcony View", "High-Speed Wi-Fi", "Climate Control AC", "Mini Refrigerator", "Complimentary Breakfast", "50\" Smart TV"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"
    ],
    badge: "Executive Choice",
  },
  {
    id: "family-suite",
    name: "Royal Family Suite",
    slug: "royal-family-suite",
    tagline: "Two interconnected bedrooms for families & groups",
    basePrice: 5499,
    taxPercent: 18,
    maxAdults: 4,
    maxChildren: 2,
    totalUnits: 5,
    availableUnits: 4,
    bedType: "2 Queen Size Beds",
    area: "520 sq.ft",
    amenities: ["Two Connected Rooms", "Living Area Lounge", "2 En-suite Bathrooms", "Microwave & Mini Bar", "Complimentary Buffet Breakfast", "Dedicated Butler"],
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
    ],
    badge: "Spacious",
  },
  {
    id: "presidential-suite",
    name: "Rama Presidential Suite",
    slug: "rama-presidential-suite",
    tagline: "The pinnacle of opulence with private dining & jacuzzi",
    basePrice: 8999,
    taxPercent: 18,
    maxAdults: 4,
    maxChildren: 2,
    totalUnits: 3,
    availableUnits: 2,
    bedType: "California King Bed",
    area: "750 sq.ft",
    amenities: ["Private Jacuzzi", "Dedicated Dining Room", "Expansive City Skyline Views", "Express VIP Check-in", "Luxury Airport Chauffeur", "24/7 Room Service"],
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
    ],
    badge: "VIP Luxury",
  },
];

export const HOTEL_AMENITIES = [
  {
    icon: "Wifi",
    title: "Ultra-Fast Wi-Fi",
    desc: "Seamless 500 Mbps fiber connectivity throughout the property for work and streaming.",
  },
  {
    icon: "Utensils",
    title: "Multi-Cuisine Restaurant",
    desc: "Exquisite Indian, Continental, and local Mughlai delights crafted by master chefs.",
  },
  {
    icon: "Clock",
    title: "24/7 Concierge & Security",
    desc: "Round-the-clock front desk assistance, CCTV surveillance, and express assistance.",
  },
  {
    icon: "Car",
    title: "Free Valet Parking",
    desc: "Secure on-premise covered parking with 24-hour valet service and EV charging.",
  },
  {
    icon: "Coffee",
    title: "Complimentary Breakfast",
    desc: "Fresh continental spread, South & North Indian buffets included with premium stays.",
  },
  {
    icon: "ShieldCheck",
    title: "Hospital-Grade Hygiene",
    desc: "Sanitized linen, daily deep cleans, and strict contactless check-in protocols.",
  },
];

