export type GameFeature = { label: string; kind: "free" | "premium" };
export type Game = {
  id: string;
  nameKey: "gameDDS" | "gameBF" | "gameCDID" | "gameEvade" | "gameDE" | "gameIV";
  image: string;
  tag: "free" | "free+premium";
  features: GameFeature[];
};

export const GAMES: Game[] = [
  {
    id: "dds",
    nameKey: "gameDDS",
    image: "https://tr.rbxcdn.com/180DAY-b722091cca44e695cd73ed89af4be42c/256/256/Image/Webp/noFilter",
    tag: "free+premium",
    features: [
      { label: "Autodrive Farm (20–25M/hour)", kind: "free" },
      { label: "Office Autofarm (17–20M/hour)", kind: "premium" },
      { label: "Courier Autofarm (22–24M/hour)", kind: "premium" },
      { label: "Mandalika Autofarm (26–30M/hour)", kind: "premium" },
      { label: "Speedhack, TP to locations", kind: "free" },
    ],
  },
  {
    id: "bf",
    nameKey: "gameBF",
    image: "https://tr.rbxcdn.com/180DAY-a64f70da20fc1e80ee76fe5d49c1be0a/256/256/Image/Webp/noFilter",
    tag: "free",
    features: [
      { label: "Full Level Autofarm", kind: "free" },
      { label: "Auto Mirage", kind: "free" },
      { label: "Auto Boss", kind: "free" },
    ],
  },
  {
    id: "cdid",
    nameKey: "gameCDID",
    image: "https://tr.rbxcdn.com/180DAY-9f546c3a4929e483241f27ddabc09945/256/256/Image/Webp/noFilter",
    tag: "free",
    features: [
      { label: "Full Truck Autofarm (4.5–7M/hour)", kind: "free" },
      { label: "Auto Minigame", kind: "free" },
      { label: "Auto Open Box", kind: "free" },
    ],
  },
  {
    id: "evade",
    nameKey: "gameEvade",
    image: "https://tr.rbxcdn.com/180DAY-bf95a86e5f5e37bf61a5f33401e95deb/512/512/Image/Webp/noFilter",
    tag: "free",
    features: [
      { label: "Auto Bhop", kind: "free" },
      { label: "Speedhack", kind: "free" },
      { label: "ESP", kind: "free" },
    ],
  },
  {
    id: "de",
    nameKey: "gameDE",
    image: "https://tr.rbxcdn.com/180DAY-fe004a62ef8232c545c99bb0e653ff59/256/256/Image/Webp/noFilter",
    tag: "free+premium",
    features: [
      { label: "Money Autofarm", kind: "free" },
      { label: "Map TP", kind: "free" },
      { label: "Fly", kind: "premium" },
    ],
  },
  {
    id: "iv",
    nameKey: "gameIV",
    image: "https://tr.rbxcdn.com/180DAY-2fd4e7cd2560ee70f3790ce50f43d440/512/512/Image/Webp/noFilter",
    tag: "free",
    features: [{ label: "Troll Features", kind: "free" }],
  },
];
