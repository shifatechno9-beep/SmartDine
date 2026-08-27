import type { Locale, MessageKey } from "@/lib/i18n";

export type LocalizedText = Record<Locale, string>;

export type DishCategory = "starters" | "mains" | "drinks";

export type Dish = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  price: number;
  category: DishCategory;
  imageUrl: string;
  available: boolean;
};

export const CATEGORY_KEYS: { id: DishCategory; label: MessageKey }[] = [
  { id: "starters", label: "cat.starters" },
  { id: "mains", label: "cat.mains" },
  { id: "drinks", label: "cat.drinks" },
];

export const emptyLocalized = (): LocalizedText => ({
  ar: "",
  fr: "",
  en: "",
});

export function localized(ar: string, fr: string, en: string): LocalizedText {
  return { ar, fr, en };
}

export function textFor(value: LocalizedText, locale: Locale) {
  return value[locale] || value.fr || value.en || value.ar;
}

export const DEMO_RESTAURANT_SLUG = "dar-zitoun";

export const DEMO_RESTAURANT_NAME = localized("دار الزيتون", "Dar Zitoun", "Dar Zitoun");

export const MENU_STORAGE_KEY = "smartdine-menu";

export const FLOOR_TABLES = 16;
export const ACTIVE_TABLES = 9;
export const TODAY_ORDERS = 36;

export const seedDishes: Dish[] = [
  {
    id: "d-zaalouk",
    title: localized("زعلوك", "Zaalouk", "Zaalouk"),
    description: localized(
      "سلطة باذنجان مشوي بزيت الزيتون والكمون والكزبرة.",
      "Salade d’aubergines grillées à l’huile d’olive, cumin et coriandre.",
      "Charred eggplant salad with olive oil, cumin, and coriander.",
    ),
    price: 35,
    category: "starters",
    imageUrl: "",
    available: true,
  },
  {
    id: "d-briouats",
    title: localized("بريوات الجبن", "Briouats au fromage", "Cheese briouats"),
    description: localized(
      "مثلثات مقرمشة محشوة بالجبن العشبي، تقدم مع عسل حر.",
      "Triangles feuilletés au fromage aux herbes, servis avec du miel.",
      "Crisp pastry triangles filled with herbed cheese, served with honey.",
    ),
    price: 45,
    category: "starters",
    imageUrl: "",
    available: true,
  },
  {
    id: "d-harira",
    title: localized("حريرة", "Harira", "Harira"),
    description: localized(
      "شوربة العدس والطماطم بالحمص والكسبرة، كلاسيكية رمضان والشتاء.",
      "Soupe de lentilles et tomates, pois chiches et coriandre.",
      "Lentil and tomato soup with chickpeas and coriander.",
    ),
    price: 28,
    category: "starters",
    imageUrl: "",
    available: true,
  },
  {
    id: "d-pastilla",
    title: localized("بسطيلة الدجاج", "Pastilla au poulet", "Chicken pastilla"),
    description: localized(
      "ورقة مقرمشة، دجاج مسكر باللوز والقرفة، رشّة سكر ناعم.",
      "Feuilleté croustillant, poulet, amandes et cannelle, sucre glace.",
      "Crisp warqa pastry, spiced chicken, almonds, cinnamon, and icing sugar.",
    ),
    price: 95,
    category: "mains",
    imageUrl: "",
    available: true,
  },
  {
    id: "d-tagine",
    title: localized(
      "طاجين الدجاج بالزيتون والحامض",
      "Tajine de poulet citron olives",
      "Chicken tagine with lemon & olives",
    ),
    description: localized(
      "دجاج بلدي متبل بالزنجبيل والزعفران، زيتون أخضر وحامض مملح.",
      "Poulet fermier, gingembre, safran, olives vertes et citron confit.",
      "Farm chicken with ginger, saffron, green olives, and preserved lemon.",
    ),
    price: 85,
    category: "mains",
    imageUrl: "",
    available: true,
  },
  {
    id: "d-couscous",
    title: localized("كسكس ملكي", "Couscous royal", "Royal couscous"),
    description: localized(
      "كسكس ناعم، لحم الغنم، الدجاج، والمرق بالخضر الموسمية.",
      "Semoule fine, agneau, poulet et bouillon aux légumes de saison.",
      "Steamed semolina, lamb, chicken, and a seasonal vegetable broth.",
    ),
    price: 120,
    category: "mains",
    imageUrl: "",
    available: true,
  },
  {
    id: "d-atay",
    title: localized("أتاي بالنعناع", "Thé à la menthe", "Moroccan mint tea"),
    description: localized(
      "شاي أخضر بالنعناع الطازج، يُسكب من علٍ في كأس بلوري.",
      "Thé vert à la menthe fraîche, versé de haut dans un verre.",
      "Gunpowder green tea with fresh mint, poured from height into a glass.",
    ),
    price: 18,
    category: "drinks",
    imageUrl: "",
    available: true,
  },
  {
    id: "d-orange",
    title: localized("عصير البرتقال", "Jus d’orange pressé", "Fresh orange juice"),
    description: localized(
      "برتقال المغرب المعصور عند الطلب، بلا سكر مضاف.",
      "Oranges marocaines pressées minute, sans sucre ajouté.",
      "Moroccan oranges pressed to order, no added sugar.",
    ),
    price: 22,
    category: "drinks",
    imageUrl: "",
    available: true,
  },
  {
    id: "d-avocado",
    title: localized("عصير الأفوكادو باللوز", "Jus d’avocat amande", "Avocado almond juice"),
    description: localized(
      "أفوكادو كريمي، حليب اللوز، ولمسة ماء الزهر.",
      "Avocat onctueux, lait d’amande et une touche d’eau de fleur d’oranger.",
      "Creamy avocado, almond milk, and a drop of orange-blossom water.",
    ),
    price: 32,
    category: "drinks",
    imageUrl: "",
    available: false,
  },
];

export function averageTicketMad(dishes: Dish[]) {
  const available = dishes.filter((dish) => dish.available);
  if (available.length === 0) {
    return 0;
  }

  const sum = available.reduce((total, dish) => total + dish.price, 0);
  return Math.round(sum / available.length);
}

export function todaySalesMad(dishes: Dish[]) {
  return TODAY_ORDERS * Math.max(averageTicketMad(dishes), 48);
}
