import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

type Language = "en" | "ha" | "yo" | "pcm";

type Track =
  | "Fish Farmer"
  | "Veterinary Doctor"
  | "Seller / Supplier"
  | "Enthusiast"
  | "Individual"
  | "Other";

type Page =
  | "welcome"
  | "auth"
  | "dashboard"
  | "farms"
  | "marketplace"
  | "community"
  | "profile";

type User = {
  name: string;
  email: string;
  phone?: string;
  role: Track | string;
  otherRole?: string;
  guest?: boolean;
};

type Farm = {
  id: string;
  name: string;
  location: string;
};

type Pond = {
  id: string;
  farmId: string;
  name: string;
  population: number;
  length: number;
  width: number;
  status: string;
};

type Feeding = {
  id: string;
  pondId: string;
  amount: number;
  date: string;
};

type Reading = {
  id: string;
  pondId: string;
  temperature: number;
  oxygen: number;
  ph: number;
  level: number;
  date: string;
};

type Listing = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  seller: string;
  emoji: string;
};

type Message = {
  id: string;
  sender: string;
  text: string;
  date: string;
  mine?: boolean;
  role?: string;
};

type SimulationRun = {
  id: string;
  pondId: string;
  createdAt: string;
  durationDays: number;
  startingWeightG: number;
  dailyGrowthG: number;
  dailyFeedKg: number;
  dailyMortalityPercent: number;
  temperatureC: number;
  dissolvedOxygenMgL: number;
  ph: number;
  projectedSurvivors: number;
  projectedBiomassKg: number;
  totalFeedKg: number;
  estimatedFcr: number;
  warnings: string[];
};

type AppData = {
  user: User | null;
  language: Language;
  farms: Farm[];
  ponds: Pond[];
  feedings: Feeding[];
  readings: Reading[];
  simulationRuns: SimulationRun[];
  listings: Listing[];
  messages: Message[];
};

const makeId = () =>
  (globalThis.crypto as { randomUUID?: () => string } | undefined)?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const today = () => new Date().toISOString().slice(0, 10);

const money = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const accountTypes: Track[] = [
  "Fish Farmer",
  "Veterinary Doctor",
  "Seller / Supplier",
  "Enthusiast",
  "Individual",
  "Other",
];

const starterListings: Listing[] = [
  {
    id: "listing-1",
    name: "Live Catfish",
    category: "Fish",
    price: 2500,
    description: "Fresh live catfish available for pickup.",
    seller: "Green Valley Farm",
    emoji: "🐟",
  },
  {
    id: "listing-2",
    name: "Catfish Feed (15kg)",
    category: "Feed",
    price: 28000,
    description: "Floating feed suitable for growing catfish.",
    seller: "AgroFeed Ltd",
    emoji: "🌾",
  },
  {
    id: "listing-3",
    name: "Catfish Fingerlings",
    category: "Fingerlings",
    price: 75,
    description: "Healthy fingerlings from a hatchery.",
    seller: "FreshFinger Hatchery",
    emoji: "🐠",
  },
  {
    id: "listing-4",
    name: "Water Quality Test Kit",
    category: "Equipment",
    price: 18500,
    description: "Test pH and basic pond water conditions.",
    seller: "AquaTech Supplies",
    emoji: "🧪",
  },
  {
    id: "listing-5",
    name: "Pond Health Consultation",
    category: "Services",
    price: 10000,
    description: "Professional pond assessment and advice.",
    seller: "Dr. Emmanuel",
    emoji: "🩺",
  },
  {
    id: "listing-6",
    name: "Pond Aerator",
    category: "Equipment",
    price: 65000,
    description: "Aeration equipment for improved oxygenation.",
    seller: "AquaTech Supplies",
    emoji: "💧",
  },
];

const starterMessages: Message[] = [
  {
    id: "msg-1",
    sender: "Emmanuel",
    role: "Fish Farmer",
    text: "My pond water became cloudy after feeding. Any suggestions?",
    date: "Today",
  },
  {
    id: "msg-2",
    sender: "Tunde",
    role: "Fish Farmer",
    text: "Check the amount of feed and remove any uneaten feed.",
    date: "Today",
  },
  {
    id: "msg-3",
    sender: "Dr. Emmanuel",
    role: "Veterinary Doctor",
    text: "Good water quality is important. Check dissolved oxygen and ammonia if possible.",
    date: "Yesterday",
  },
];

const initialData: AppData = {
  user: null,
  language: "en",
  farms: [],
  ponds: [],
  feedings: [],
  readings: [],
  simulationRuns: [],
  listings: starterListings,
  messages: starterMessages,
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    welcome: "Smarter Fish Farming Together",
    description:
      "Manage your ponds, buy and sell, get expert advice, and grow your fish business — all in one place.",
    getStarted: "Get Started",
    login: "Login",
    dashboard: "Dashboard",
    farms: "My Farms",
    marketplace: "Marketplace",
    community: "Community",
    profile: "Profile",
    greeting: "Here's what's happening on your farm today.",
    addFarm: "Add Farm",
    addPond: "Add Pond",
    logout: "Log Out",
  },

  ha: {
    welcome: "Kiwo Kifi Mai Sauki Tare",
    description:
      "Sarrafa tafkunanka, saya da sayarwa, samun shawarar masana, da bunkasa kasuwancinka na kifi.",
    getStarted: "Fara Yanzu",
    login: "Shiga",
    dashboard: "Babban Shafi",
    farms: "Gonakina",
    marketplace: "Kasuwa",
    community: "Al'umma",
    profile: "Bayanan Kai",
    greeting: "Ga abin da ke faruwa a gonarka yau.",
    addFarm: "Ƙara Gona",
    addPond: "Ƙara Tafki",
    logout: "Fita",
  },

  yo: {
    welcome: "Ise Oko Eja To Rorun Papọ",
    description:
      "Se akoso awon adagun eja re, ra ati ta, gba imoran awon amoye, ki o si se agbekale ise oko eja re.",
    getStarted: "Bere Bayi",
    login: "Wole",
    dashboard: "Oju Iṣakoso",
    farms: "Awon Oko Mi",
    marketplace: "Oja",
    community: "Awon Eniyan",
    profile: "Profaili",
    greeting: "Eyi ni ohun to n sele ni oko re loni.",
    addFarm: "Fi Oko Kun",
    addPond: "Fi Adagun Kun",
    logout: "Jade",
  },

  pcm: {
    welcome: "Better Fish Farming Together",
    description:
      "Manage your ponds, buy and sell fish, get expert advice, and grow your fish business for one place.",
    getStarted: "Start Now",
    login: "Login",
    dashboard: "Dashboard",
    farms: "My Farms",
    marketplace: "Market",
    community: "Community",
    profile: "Profile",
    greeting: "See wetin dey happen for your farm today.",
    addFarm: "Add Farm",
    addPond: "Add Pond",
    logout: "Log Out",
  },
};

const trackDescriptions: Record<string, string> = {
  "Fish Farmer":
    "Manage farms, ponds, feeding records, fish population and water quality.",

  "Veterinary Doctor":
    "Support fish health, review farm concerns and share professional guidance.",

  "Seller / Supplier":
    "Showcase fish, feed, fingerlings, equipment and farming services.",

  Enthusiast:
    "Explore fish farming, learn from the community and discover useful resources.",

  Individual:
    "Explore FishLink, connect with people and follow fish farming activities.",

  Other:
    "Your FishLink workspace is ready. Explore the platform and customize your activities.",
};

const trackMetrics: Record<string, string[]> = {
  "Fish Farmer": ["Farms", "Ponds", "Fish Population", "Feed Records"],
  "Veterinary Doctor": [
    "Farmers",
    "Health Topics",
    "Consultations",
    "Community",
  ],
  "Seller / Supplier": [
    "Listings",
    "Product Categories",
    "Customers",
    "Orders",
  ],
  Enthusiast: [
    "Learning Topics",
    "Community Posts",
    "Farmers",
    "Resources",
  ],
  Individual: ["Community", "Marketplace", "Farmers", "Resources"],
  Other: ["Marketplace", "Community", "Farms", "Resources"],
};

function readSavedData(): AppData {
  try {
    const saved = localStorage.getItem("fishlink-data-v2");

    if (!saved) return initialData;

    const parsed = JSON.parse(saved);

    return {
      ...initialData,
      ...parsed,
      listings: parsed.listings?.length
        ? parsed.listings
        : starterListings,
      messages: parsed.messages?.length
        ? parsed.messages
        : starterMessages,
      simulationRuns: parsed.simulationRuns ?? [],
    };
  } catch {
    return initialData;
  }
}

export default function App() {
  const [data, setData] = useState<AppData>(readSavedData);

  const [page, setPage] = useState<Page>(() =>
    readSavedData().user ? "dashboard" : "welcome"
  );

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [farmTab, setFarmTab] = useState("farms");
  // Simulation form state is kept separate from farm records so it can map
  // cleanly to a future POST /api/simulations endpoint.
  const [simulationPondId, setSimulationPondId] = useState("");
  const [simulationDays, setSimulationDays] = useState(90);
  const [simulationStartingWeight, setSimulationStartingWeight] = useState(50);
  const [simulationDailyGrowth, setSimulationDailyGrowth] = useState(2);
  const [simulationDailyFeed, setSimulationDailyFeed] = useState(1);
  const [simulationMortality, setSimulationMortality] = useState(0.1);
  const [simulationTemperature, setSimulationTemperature] = useState(28);
  const [simulationOxygen, setSimulationOxygen] = useState(6);
  const [simulationPh, setSimulationPh] = useState(7.2);

  const [showFarmForm, setShowFarmForm] = useState(false);
  const [showPondForm, setShowPondForm] = useState(false);
  const [showFeedForm, setShowFeedForm] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);

  const [selectedFarm, setSelectedFarm] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [chatText, setChatText] = useState("");
  const [toast, setToast] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Track | "">("");

  const [loginEmail, setLoginEmail] = useState(
    localStorage.getItem("fishlink-remembered-email") || ""
  );

  const t = (key: string) =>
    translations[data.language]?.[key] ?? translations.en[key] ?? key;

  useEffect(() => {
    localStorage.setItem("fishlink-data-v2", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(""), 2800);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (message: string) => setToast(message);

  const update = (changes: Partial<AppData>) =>
    setData((old) => ({ ...old, ...changes }));

  const go = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeLanguage = (language: Language) =>
    update({ language });

  const totalFish = data.ponds.reduce(
    (sum, pond) => sum + pond.population,
    0
  );

  const totalFeed = data.feedings.reduce(
    (sum, record) => sum + record.amount,
    0
  );

  const farmPonds = data.ponds.filter(
    (pond) => !selectedFarm || pond.farmId === selectedFarm
  );

  const recentFeedings = useMemo(
    () =>
      [...data.feedings]
        .filter((record) =>
          farmPonds.some((pond) => pond.id === record.pondId)
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.feedings, farmPonds]
  );

  const recentReadings = useMemo(
    () =>
      [...data.readings]
        .filter((record) =>
          farmPonds.some((pond) => pond.id === record.pondId)
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.readings, farmPonds]
  );

  // AUTHENTICATION

  const handleAuth = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const password = String(form.get("password") || "");
    const role = String(form.get("role") || "").trim();
    const otherRole = String(form.get("otherRole") || "").trim();

    if (!email || !password || (authMode === "register" && !name)) {
      notify("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      notify("Password must contain at least 6 characters.");
      return;
    }

    if (authMode === "register" && !role) {
      notify("Please select your FishLink track.");
      return;
    }

    if (authMode === "register" && role === "Other" && !otherRole) {
      notify("Please specify your category.");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("fishlink-remembered-email", email);
    } else {
      localStorage.removeItem("fishlink-remembered-email");
    }

    const user: User = {
      name: name || email.split("@")[0],
      email,
      phone,
      role:
        authMode === "register"
          ? role
          : data.user?.role || "Fish Farmer",
      otherRole:
        authMode === "register"
          ? otherRole
          : data.user?.otherRole,
    };

    update({ user });

    go("dashboard");

    notify(
      authMode === "register"
        ? "Welcome to FishLink!"
        : "Welcome back!"
    );
  };

  const continueAsGuest = (role: Track = "Individual") => {
    update({
      user: {
        name: "Guest",
        email: "",
        role,
        guest: true,
      },
    });

    go("dashboard");

    notify("You are exploring FishLink as a guest.");
  };

  const logout = () => {
    update({ user: null });

    setShowPassword(false);

    go("welcome");

    notify("You have logged out.");
  };

  // FARM MANAGEMENT

  const addFarm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const name = String(form.get("farmName") || "").trim();
    const location = String(form.get("location") || "").trim();

    if (!name || !location) return;

    const farm = {
      id: makeId(),
      name,
      location,
    };

    update({
      farms: [...data.farms, farm],
    });

    setSelectedFarm(farm.id);
    setShowFarmForm(false);

    event.currentTarget.reset();

    notify("Farm added.");
  };

  const addPond = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const farmId = String(form.get("farmId") || "");
    const name = String(form.get("pondName") || "").trim();
    const population = Number(form.get("population"));
    const length = Number(form.get("length"));
    const width = Number(form.get("width"));

    if (
      !farmId ||
      !name ||
      population <= 0 ||
      length <= 0 ||
      width <= 0
    ) {
      notify("Enter valid pond information.");
      return;
    }

    const pond: Pond = {
      id: makeId(),
      farmId,
      name,
      population,
      length,
      width,
      status: "Active",
    };

    update({
      ponds: [...data.ponds, pond],
    });

    setSelectedFarm(farmId);
    setShowPondForm(false);

    event.currentTarget.reset();

    notify("Pond added.");
  };

  const deleteFarm = (id: string) => {
    if (!window.confirm("Delete this farm and its records?")) return;

    const pondIds = data.ponds
      .filter((pond) => pond.farmId === id)
      .map((pond) => pond.id);

    update({
      farms: data.farms.filter((farm) => farm.id !== id),
      ponds: data.ponds.filter((pond) => pond.farmId !== id),
      feedings: data.feedings.filter(
        (record) => !pondIds.includes(record.pondId)
      ),
      readings: data.readings.filter(
        (record) => !pondIds.includes(record.pondId)
      ),
    });

    if (selectedFarm === id) setSelectedFarm("");

    notify("Farm deleted.");
  };

  const deletePond = (id: string) => {
    if (!window.confirm("Delete this pond and its records?")) return;

    update({
      ponds: data.ponds.filter((pond) => pond.id !== id),
      feedings: data.feedings.filter(
        (record) => record.pondId !== id
      ),
      readings: data.readings.filter(
        (record) => record.pondId !== id
      ),
    });

    notify("Pond deleted.");
  };

  // PRODUCTION

  const addFeeding = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const pondId = String(form.get("pondId") || "");
    const amount = Number(form.get("amount"));
    const date = String(form.get("date") || today());

    if (!pondId || amount <= 0) {
      notify("Choose a pond and enter a valid feed amount.");
      return;
    }

    update({
      feedings: [
        ...data.feedings,
        {
          id: makeId(),
          pondId,
          amount,
          date,
        },
      ],
    });

    setShowFeedForm(false);

    event.currentTarget.reset();

    notify("Feeding record saved.");
  };

  // WATER MONITORING

  const addReading = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const pondId = String(form.get("pondId") || "");
    const temperature = Number(form.get("temperature"));
    const oxygen = Number(form.get("oxygen"));
    const ph = Number(form.get("ph"));
    const level = Number(form.get("level"));

    if (
      !pondId ||
      [temperature, oxygen, ph, level].some(
        (value) => !Number.isFinite(value) || value < 0
      )
    ) {
      notify("Enter valid water readings.");
      return;
    }

    update({
      readings: [
        ...data.readings,
        {
          id: makeId(),
          pondId,
          temperature,
          oxygen,
          ph,
          level,
          date: new Date().toISOString(),
        },
      ],
    });

    setShowReadingForm(false);

    event.currentTarget.reset();

    notify("Water reading saved.");
  };

  // POND SIMULATION
  // This is an illustrative planning model, not a validated biological forecast.
  // Keep the input/output shape stable: it can be sent to a backend simulation service later.
  const runPondSimulation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pond = data.ponds.find((item) => item.id === simulationPondId);
    if (!pond) {
      notify("Choose a pond before running the simulation.");
      return;
    }

    const temperatureStress = simulationTemperature < 26 || simulationTemperature > 30;
    const oxygenStress = simulationOxygen < 5;
    const phStress = simulationPh < 6.5 || simulationPh > 8.5;
    const dailyStressPenalty = (temperatureStress ? 0.0005 : 0) +
      (oxygenStress ? 0.001 : 0) + (phStress ? 0.0005 : 0);
    const dailyLossRate = Math.min(0.05, simulationMortality / 100 + dailyStressPenalty);
    const projectedSurvivors = Math.max(0, Math.round(
      pond.population * Math.pow(1 - dailyLossRate, simulationDays)
    ));
    const projectedAverageWeightG = simulationStartingWeight + simulationDailyGrowth * simulationDays;
    const projectedBiomassKg = projectedSurvivors * projectedAverageWeightG / 1000;
    const initialBiomassKg = pond.population * simulationStartingWeight / 1000;
    const totalFeedKg = simulationDailyFeed * simulationDays;
    const biomassGainKg = Math.max(0, projectedBiomassKg - initialBiomassKg);
    const estimatedFcr = biomassGainKg > 0 ? totalFeedKg / biomassGainKg : 0;
    const warnings = [
      ...(temperatureStress ? ["Temperature is outside the model's preferred 26–30°C planning range."] : []),
      ...(oxygenStress ? ["Dissolved oxygen is below the 5 mg/L planning threshold."] : []),
      ...(phStress ? ["pH is outside the model's preferred 6.5–8.5 planning range."] : []),
    ];

    const run: SimulationRun = {
      id: makeId(), pondId: pond.id, createdAt: new Date().toISOString(),
      durationDays: simulationDays, startingWeightG: simulationStartingWeight,
      dailyGrowthG: simulationDailyGrowth, dailyFeedKg: simulationDailyFeed,
      dailyMortalityPercent: simulationMortality, temperatureC: simulationTemperature,
      dissolvedOxygenMgL: simulationOxygen, ph: simulationPh,
      projectedSurvivors, projectedBiomassKg: Number(projectedBiomassKg.toFixed(2)),
      totalFeedKg: Number(totalFeedKg.toFixed(2)), estimatedFcr: Number(estimatedFcr.toFixed(2)), warnings,
    };
    update({ simulationRuns: [run, ...data.simulationRuns] });
    notify("Pond simulation completed. Results saved.");
  };

  // MARKETPLACE

  const categories = [
    "All",
    "Fish",
    "Feed",
    "Fingerlings",
    "Equipment",
    "Services",
  ];

  const addListing = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const name = String(form.get("productName") || "").trim();
    const price = Number(form.get("price"));
    const listingCategory = String(
      form.get("category") || "Fish"
    );
    const description = String(
      form.get("description") || ""
    ).trim();

    if (!name || price <= 0) {
      notify("Enter a product name and valid price.");
      return;
    }

    const emoji: Record<string, string> = {
      Fish: "🐟",
      Feed: "🌾",
      Fingerlings: "🐠",
      Equipment: "⚙️",
      Services: "🛠️",
    };

    update({
      listings: [
        {
          id: makeId(),
          name,
          category: listingCategory,
          price,
          description,
          seller: data.user?.name || "FishLink Member",
          emoji: emoji[listingCategory] || "📦",
        },
        ...data.listings,
      ],
    });

    event.currentTarget.reset();

    notify("Listing published.");
  };

  const visibleListings = data.listings.filter((listing) => {
    const matchesCategory =
      category === "All" || listing.category === category;

    const term = search.toLowerCase();

    const matchesSearch =
      listing.name.toLowerCase().includes(term) ||
      listing.description.toLowerCase().includes(term) ||
      listing.seller.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  // COMMUNITY

  const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!chatText.trim()) return;

    update({
      messages: [
        ...data.messages,
        {
          id: makeId(),
          sender: data.user?.name || "Guest",
          role: data.user?.role || "Member",
          text: chatText.trim(),
          date: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          mine: true,
        },
      ],
    });

    setChatText("");
  };

  // REUSABLE COMPONENTS

  const Brand = ({ dark = false }: { dark?: boolean }) => (
    <div className={`brand ${dark ? "brand-dark" : ""}`}>
      <div className="brand-icon">🐟</div>

      <div className="brand-copy">
        <strong>
          Fish<span>Link</span>
        </strong>
        <small>Connect · Learn · Grow</small>
      </div>
    </div>
  );

  const LanguageSelect = () => (
    <label className="language-select">
      <span>◎</span>

      <select
        aria-label="Choose language"
        value={data.language}
        onChange={(event) =>
          changeLanguage(event.target.value as Language)
        }
      >
        <option value="en">English</option>
        <option value="ha">Hausa</option>
        <option value="yo">Yoruba</option>
        <option value="pcm">Pidgin</option>
      </select>
    </label>
  );

  const Button = ({
    children,
    onClick,
    outline = false,
    type = "button",
    disabled = false,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    outline?: boolean;
    type?: "button" | "submit";
    disabled?: boolean;
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button ${
        outline ? "button-outline" : "button-primary"
      }`}
    >
      {children}
    </button>
  );

  const Metric = ({
    icon,
    label,
    value,
    sub,
  }: {
    icon: string;
    label: string;
    value: string | number;
    sub?: string;
  }) => (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      {sub && <span className="metric-sub">{sub}</span>}
    </article>
  );

  const Empty = ({
    title,
    description,
    icon = "🌱",
  }: {
    title: string;
    description: string;
    icon?: string;
  }) => (
    <div className="empty-state">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );

  const Heading = ({
    title,
    description,
    action,
  }: {
    title: string;
    description?: string;
    action?: React.ReactNode;
  }) => (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>

      {action}
    </div>
  );

  // =====================================================
  // WELCOME SCREEN — YOUR ORIGINAL UPLOADED DESIGN
  // =====================================================

  if (page === "welcome") {
    const welcomeStyle: React.CSSProperties = {
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",

      backgroundImage:
        `linear-gradient(180deg, rgba(0,35,62,.35), rgba(0,31,49,.08) 45%, rgba(0,30,43,.48)), url('${process.env.PUBLIC_URL || ""}/images/fishlink-pond.png')`,

      backgroundSize: "cover",
      backgroundPosition: "center",

      color: "#fff",
      fontFamily: "'DM Sans', Arial, sans-serif",
    };

    const welcomeOverlay: React.CSSProperties = {
      position: "absolute",
      inset: 0,

      background:
        "linear-gradient(180deg, rgba(0,39,65,.35) 0%, rgba(0,55,75,.05) 45%, rgba(0,32,49,.35) 100%)",

      pointerEvents: "none",
    };

    const welcomeContent: React.CSSProperties = {
      position: "relative",
      zIndex: 1,
      width: "100%",
      maxWidth: 460,
      minHeight: "100vh",
      padding: "22px 25px 28px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    };

    const logo: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 25,
    };

    const logoMark: React.CSSProperties = {
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: "linear-gradient(145deg, #08b7d4, #05a879)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 32,
      boxShadow: "0 5px 20px rgba(0,0,0,.2)",
    };

    const logoName: React.CSSProperties = {
      fontSize: 34,
      fontWeight: 800,
      letterSpacing: "-1.5px",
      lineHeight: 1,
    };

    const primaryButton: React.CSSProperties = {
      width: "100%",
      height: 49,
      border: "none",
      borderRadius: 28,
      background: "linear-gradient(100deg, #08c98b, #08a879)",
      color: "#fff",
      fontSize: 15,
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 6px 18px rgba(0,0,0,.16)",
    };

    const secondaryButton: React.CSSProperties = {
      ...primaryButton,
      background: "rgba(0,30,55,.35)",
      border: "2px solid #05c5c4",
      boxShadow: "none",
    };

    return (
      <main style={welcomeStyle}>
        <div style={welcomeOverlay} />

        <div style={welcomeContent}>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <select
              value={data.language}
              onChange={(event) =>
                changeLanguage(event.target.value as Language)
              }
              aria-label="Select language"
              style={{
                background: "rgba(0,35,57,.65)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.45)",
                borderRadius: 20,
                padding: "8px 12px",
                outline: "none",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <option style={{ color: "#123" }} value="en">
                English
              </option>

              <option style={{ color: "#123" }} value="ha">
                Hausa
              </option>

              <option style={{ color: "#123" }} value="yo">
                Yoruba
              </option>

              <option style={{ color: "#123" }} value="pcm">
                Pidgin
              </option>
            </select>
          </div>

          <div style={logo}>
            <div style={logoMark}>🐟</div>

            <div>
              <div style={logoName}>
                Fish
                <span style={{ color: "#08c99a" }}>Link</span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: ".4px",
                  marginTop: 5,
                  color: "#e5f7f7",
                }}
              >
                Connect · Learn · Grow
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: 47,
              maxWidth: 340,
              textShadow: "0 2px 7px rgba(0,0,0,.25)",
            }}
          >
            <h1
              style={{
                fontSize: 22,
                lineHeight: 1.35,
                fontWeight: 800,
                margin: "0 0 14px",
              }}
            >
              {t("welcome")}
            </h1>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                margin: 0,
                color: "#f0fbff",
                fontWeight: 500,
              }}
            >
              {t("description")}
            </p>
          </div>

          <div style={{ flex: 1, minHeight: 100 }} />

          <div
            style={{
              width: "100%",
              display: "grid",
              gap: 10,
            }}
          >
            <button
              style={primaryButton}
              onClick={() => {
                setAuthMode("register");
                setShowPassword(false);
                setSelectedRole("");
                go("auth");
              }}
            >
              {t("getStarted")}
            </button>

            <button
              style={secondaryButton}
              onClick={() => {
                setAuthMode("login");
                setShowPassword(false);
                go("auth");
              }}
            >
              {t("login")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // LOGIN AND REGISTRATION
  // =====================================================

  if (page === "auth") {
    return (
      <main className="auth-screen">
        <header className="auth-header">
          <button
            className="back-button"
            onClick={() => go("welcome")}
          >
            ← Back
          </button>

          <LanguageSelect />
        </header>

        <section className="auth-card">
          <Brand dark />

          <span className="eyebrow">CONNECT · LEARN · GROW</span>

          <h1>
            {authMode === "login"
              ? "Welcome Back"
              : "Create Account"}
          </h1>

          <p>
            {authMode === "login"
              ? "Sign in to your FishLink account."
              : "Join FishLink and grow with the fish farming community."}
          </p>

          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === "register" && (
              <>
                <label>
                  Full Name
                  <input
                    name="name"
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Your phone number"
                  />
                </label>

                <div className="role-selection">
                  <label>How are you joining FishLink?</label>

                  <p className="role-description">
                    Choose the track that best describes you.
                  </p>

                  <div className="role-grid">
                    {accountTypes.map((role) => {
                      const icons: Record<Track, string> = {
                        "Fish Farmer": "🐟",
                        "Veterinary Doctor": "🩺",
                        "Seller / Supplier": "🛒",
                        Enthusiast: "🌱",
                        Individual: "👤",
                        Other: "✨",
                      };

                      return (
                        <label
                          className={`role-option ${
                            selectedRole === role ? "selected" : ""
                          }`}
                          key={role}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role}
                            checked={selectedRole === role}
                            onChange={() => setSelectedRole(role)}
                            required
                          />

                          <span className="role-icon">
                            {icons[role]}
                          </span>

                          <span>{role}</span>
                        </label>
                      );
                    })}
                  </div>

                  {selectedRole === "Other" && (
                    <label className="other-role-field">
                      Specify your category

                      <input
                        name="otherRole"
                        placeholder="e.g. Researcher, Student, Investor"
                        required
                      />
                    </label>
                  )}
                </div>
              </>
            )}

            <label>
              Email Address

              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={loginEmail}
                onChange={(event) =>
                  setLoginEmail(event.target.value)
                }
                required
              />
            </label>

            <label className="password-field">
              Password

              <div className="password-input-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  placeholder="At least 6 characters"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((old) => !old)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {authMode === "login" && (
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />

                Remember me
              </label>
            )}

            <button
              className="button button-primary"
              type="submit"
            >
              {authMode === "login"
                ? "Login"
                : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                );
                setSelectedRole("");
                setShowPassword(false);
              }}
            >
              {authMode === "login" ? "Sign Up" : "Login"}
            </button>
          </div>

          <button
            className="guest-link auth-guest"
            onClick={() => continueAsGuest("Individual")}
          >
            Continue as Guest →
          </button>

          <div className="local-note">
            FishLink prototype: account details and farm records
            are stored locally in this browser. Secure authentication
            and cross-device accounts require the backend.
          </div>
        </section>
      </main>
    );
  }

  // =====================================================
  // MAIN APPLICATION NAVIGATION
  // =====================================================

  const navItems: {
    id: Page;
    label: string;
    icon: string;
  }[] = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: "⌂",
    },
    {
      id: "farms",
      label: t("farms"),
      icon: "🏡",
    },
    {
      id: "marketplace",
      label: t("marketplace"),
      icon: "🛒",
    },
    {
      id: "community",
      label: t("community"),
      icon: "💬",
    },
    {
      id: "profile",
      label: t("profile"),
      icon: "👤",
    },
  ];

  const currentRole =
    data.user?.role === "Other" && data.user.otherRole
      ? data.user.otherRole
      : data.user?.role || "FishLink Member";

  const dashboardRole =
    data.user?.role === "Other" && data.user.otherRole
      ? data.user.otherRole
      : data.user?.role || "Individual";

  const isFarmer = data.user?.role === "Fish Farmer";
  const isSeller = data.user?.role === "Seller / Supplier";
  const isDoctor = data.user?.role === "Veterinary Doctor";

  return (
    <div className="app-shell">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <Brand />

        <div className="sidebar-label">MAIN MENU</div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                page === item.id ? "active" : ""
              }`}
              onClick={() => go(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="user-avatar">
            {data.user?.name.charAt(0).toUpperCase() || "F"}
          </span>

          <div>
            <strong>{data.user?.name || "Guest"}</strong>
            <small>{currentRole}</small>
          </div>
        </div>

        <button
          className="nav-item logout-button"
          onClick={logout}
        >
          <span className="nav-icon">↪</span>
          {t("logout")}
        </button>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand dark />
          </div>

          <span className="topbar-title">
            FishLink / {t(page)}
          </span>

          <div className="topbar-right">
            <LanguageSelect />

            <button
              className="avatar-button"
              onClick={() => go("profile")}
              aria-label="Open profile"
            >
              {data.user?.name.charAt(0).toUpperCase() || "G"}
            </button>
          </div>
        </header>

        <div className="page-content">
          {/* DASHBOARD */}

          {page === "dashboard" && (
            <>
              <section className="dashboard-banner">
                <div>
                  <span>YOUR FISHLINK WORKSPACE</span>

                  <h1>
                    Welcome, {data.user?.name || "Guest"}!
                  </h1>

                  <p>
                    {trackDescriptions[dashboardRole] ||
                      trackDescriptions.Other}
                  </p>

                  <span className="track-chip">
                    {currentRole}
                  </span>
                </div>

                <div className="banner-fish">🐟</div>
              </section>

              {isFarmer ? (
                <>
                  <div className="metric-grid">
                    <Metric
                      icon="🏡"
                      label="My Farms"
                      value={data.farms.length}
                    />

                    <Metric
                      icon="🐟"
                      label="Total Ponds"
                      value={data.ponds.length}
                    />

                    <Metric
                      icon="🐠"
                      label="Fish Population"
                      value={totalFish.toLocaleString()}
                    />

                    <Metric
                      icon="🌾"
                      label="Total Feed"
                      value={`${totalFeed} kg`}
                    />
                  </div>

                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Water Quality Overview</h2>
                        <p>Latest recorded water reading</p>
                      </div>

                      <Button
                        outline
                        onClick={() => {
                          setFarmTab("water");
                          go("farms");
                        }}
                      >
                        View
                      </Button>
                    </div>

                    {recentReadings.length === 0 ? (
                      <Empty
                        title="No water readings yet"
                        description="Add a reading under My Farms → Water Monitoring."
                        icon="💧"
                      />
                    ) : (
                      <div className="metric-grid">
                        <Metric
                          icon="🌡️"
                          label="Temperature"
                          value={`${recentReadings[0].temperature}°C`}
                        />

                        <Metric
                          icon="💨"
                          label="Dissolved Oxygen"
                          value={`${recentReadings[0].oxygen} mg/L`}
                        />

                        <Metric
                          icon="💧"
                          label="pH Level"
                          value={recentReadings[0].ph}
                        />

                        <Metric
                          icon="🌊"
                          label="Water Level"
                          value={`${recentReadings[0].level} m`}
                        />
                      </div>
                    )}
                  </section>
                </>
              ) : isSeller ? (
                <div className="metric-grid">
                  <Metric
                    icon="🛒"
                    label="My Listings"
                    value={
                      data.listings.filter(
                        (item) => item.seller === data.user?.name
                      ).length
                    }
                  />

                  <Metric
                    icon="📦"
                    label="Categories"
                    value={5}
                  />

                  <Metric
                    icon="👥"
                    label="Potential Customers"
                    value="Explore"
                  />

                  <Metric
                    icon="📈"
                    label="Marketplace"
                    value="Open"
                  />
                </div>
              ) : isDoctor ? (
                <div className="metric-grid">
                  <Metric icon="🩺" label="Health Topics" value={3} />
                  <Metric
                    icon="👥"
                    label="Farmers"
                    value={data.farms.length}
                  />
                  <Metric
                    icon="💬"
                    label="Community"
                    value={data.messages.length}
                  />
                  <Metric
                    icon="📚"
                    label="Resources"
                    value="Explore"
                  />
                </div>
              ) : (
                <div className="metric-grid">
                  {(trackMetrics[dashboardRole] ||
                    trackMetrics.Other).map((label, index) => (
                    <Metric
                      key={label}
                      icon={["🌱", "💬", "🛒", "📚"][index % 4]}
                      label={label}
                      value={
                        index === 0 ? data.farms.length : "Explore"
                      }
                    />
                  ))}
                </div>
              )}

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Explore FishLink</h2>
                    <p>Choose where you want to go next.</p>
                  </div>
                </div>

                <div className="quick-grid">
                  <button onClick={() => go("farms")}>
                    <span>🏡</span>
                    <strong>My Farms</strong>
                    <small>Manage ponds and production</small>
                  </button>

                  <button onClick={() => go("marketplace")}>
                    <span>🛒</span>
                    <strong>Marketplace</strong>
                    <small>Discover products and services</small>
                  </button>

                  <button onClick={() => go("community")}>
                    <span>💬</span>
                    <strong>Community</strong>
                    <small>Connect and learn together</small>
                  </button>
                </div>
              </section>

              {isFarmer && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>My Farms</h2>
                      <p>Your registered farms</p>
                    </div>

                    <Button onClick={() => go("farms")}>
                      View Farms
                    </Button>
                  </div>

                  {data.farms.length === 0 ? (
                    <Empty
                      title="No farms added yet"
                      description="Add your first farm to begin managing your fish farming activities."
                      icon="🏡"
                    />
                  ) : (
                    data.farms.slice(0, 4).map((farm) => (
                      <div className="record-row" key={farm.id}>
                        <span className="record-icon">🏡</span>

                        <div className="record-main">
                          <strong>{farm.name}</strong>
                          <small>{farm.location}</small>
                        </div>

                        <strong>
                          {
                            data.ponds.filter(
                              (pond) => pond.farmId === farm.id
                            ).length
                          }{" "}
                          ponds
                        </strong>
                      </div>
                    ))
                  )}
                </section>
              )}
            </>
          )}

          {/* MY FARMS */}

          {page === "farms" && (
            <>
              <Heading
                title="My Farms"
                description="Manage farms, ponds, production and water quality."
                action={
                  farmTab === "farms" ? (
                    <Button
                      onClick={() =>
                        setShowFarmForm((old) => !old)
                      }
                    >
                      + {t("addFarm")}
                    </Button>
                  ) : farmTab === "ponds" ? (
                    <Button
                      disabled={!data.farms.length}
                      onClick={() =>
                        setShowPondForm((old) => !old)
                      }
                    >
                      + {t("addPond")}
                    </Button>
                  ) : null
                }
              />

              <div className="subnav">
                {[
                  ["farms", "Farms"],
                  ["ponds", "Ponds"],
                  ["production", "Production"],
                  ["water", "Water Monitoring"],
                  ["simulation", "Pond Simulation"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={farmTab === id ? "chosen" : ""}
                    onClick={() => {
                      setFarmTab(id);
                      setShowFarmForm(false);
                      setShowPondForm(false);
                      setShowFeedForm(false);
                      setShowReadingForm(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* FARMS TAB */}

              {farmTab === "farms" && (
                <>
                  {showFarmForm && (
                    <form
                      className="entry-form"
                      onSubmit={addFarm}
                    >
                      <h3>Add a Farm</h3>

                      <label>
                        Farm Name
                        <input
                          name="farmName"
                          placeholder="e.g. Green Valley Farm"
                          required
                        />
                      </label>

                      <label>
                        Location
                        <input
                          name="location"
                          placeholder="Farm location"
                          required
                        />
                      </label>

                      <div className="form-actions">
                        <Button type="submit">Save Farm</Button>

                        <Button
                          outline
                          onClick={() => setShowFarmForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {data.farms.length === 0 ? (
                    <Empty
                      title="No farms added yet"
                      description="Add your first farm to get started."
                      icon="🏡"
                    />
                  ) : (
                    data.farms.map((farm) => {
                      const ponds = data.ponds.filter(
                        (pond) => pond.farmId === farm.id
                      );

                      const fish = ponds.reduce(
                        (sum, pond) => sum + pond.population,
                        0
                      );

                      return (
                        <article
                          className="farm-block"
                          key={farm.id}
                        >
                          <div className="farm-block-heading">
                            <span className="farm-landscape">
                              🏞️
                            </span>

                            <div>
                              <strong>{farm.name}</strong>
                              <small>{farm.location}</small>
                            </div>

                            <button
                              className="delete-icon"
                              onClick={() => deleteFarm(farm.id)}
                              aria-label={`Delete ${farm.name}`}
                            >
                              ×
                            </button>
                          </div>

                          <div className="metric-grid compact">
                            <Metric
                              icon="🐟"
                              label="Ponds"
                              value={ponds.length}
                            />

                            <Metric
                              icon="🐠"
                              label="Fish"
                              value={fish.toLocaleString()}
                            />
                          </div>

                          <Button
                            outline
                            onClick={() => {
                              setSelectedFarm(farm.id);
                              setFarmTab("ponds");
                            }}
                          >
                            View Ponds →
                          </Button>
                        </article>
                      );
                    })
                  )}
                </>
              )}

              {/* PONDS TAB */}

              {farmTab === "ponds" && (
                <>
                  {showPondForm && (
                    <form
                      className="entry-form"
                      onSubmit={addPond}
                    >
                      <h3>Add a Pond</h3>

                      <label>
                        Farm

                        <select
                          name="farmId"
                          defaultValue={selectedFarm}
                          required
                        >
                          <option value="">Choose a farm</option>

                          {data.farms.map((farm) => (
                            <option
                              key={farm.id}
                              value={farm.id}
                            >
                              {farm.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Pond Name
                        <input
                          name="pondName"
                          placeholder="Pond 1"
                          required
                        />
                      </label>

                      <label>
                        Fish Population
                        <input
                          name="population"
                          type="number"
                          min="1"
                          required
                        />
                      </label>

                      <div className="form-two">
                        <label>
                          Length (m)
                          <input
                            name="length"
                            type="number"
                            min="0.1"
                            step="0.1"
                            required
                          />
                        </label>

                        <label>
                          Width (m)
                          <input
                            name="width"
                            type="number"
                            min="0.1"
                            step="0.1"
                            required
                          />
                        </label>
                      </div>

                      <div className="form-actions">
                        <Button type="submit">Save Pond</Button>

                        <Button
                          outline
                          onClick={() => setShowPondForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  <label className="filter-label">
                    Filter by farm

                    <select
                      value={selectedFarm}
                      onChange={(event) =>
                        setSelectedFarm(event.target.value)
                      }
                    >
                      <option value="">All farms</option>

                      {data.farms.map((farm) => (
                        <option
                          key={farm.id}
                          value={farm.id}
                        >
                          {farm.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {farmPonds.length === 0 ? (
                    <Empty
                      title="No ponds added yet"
                      description="Add a farm, then register its ponds."
                      icon="🐟"
                    />
                  ) : (
                    farmPonds.map((pond) => (
                      <article
                        className="pond-card"
                        key={pond.id}
                      >
                        <div className="pond-art">🐟</div>

                        <div className="pond-info">
                          <div className="pond-title">
                            <strong>{pond.name}</strong>
                            <span className="status-pill">
                              {pond.status}
                            </span>
                          </div>

                          <small>
                            {
                              data.farms.find(
                                (farm) => farm.id === pond.farmId
                              )?.name
                            }{" "}
                            · Catfish
                          </small>

                          <p>
                            {pond.population.toLocaleString()} fish ·{" "}
                            {pond.length} × {pond.width} m
                          </p>
                        </div>

                        <button
                          className="delete-icon"
                          onClick={() => deletePond(pond.id)}
                          aria-label={`Delete ${pond.name}`}
                        >
                          ×
                        </button>
                      </article>
                    ))
                  )}
                </>
              )}

              {/* PRODUCTION TAB */}

              {farmTab === "production" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Feeding Records</h2>
                      <p>
                        Track feed quantities and feeding dates.
                      </p>
                    </div>

                    <Button
                      disabled={!data.ponds.length}
                      onClick={() =>
                        setShowFeedForm((old) => !old)
                      }
                    >
                      + Record Feeding
                    </Button>
                  </div>

                  {showFeedForm && (
                    <form
                      className="entry-form"
                      onSubmit={addFeeding}
                    >
                      <h3>Record Feeding</h3>

                      <label>
                        Pond

                        <select
                          name="pondId"
                          required
                          defaultValue=""
                        >
                          <option value="">Choose a pond</option>

                          {data.ponds.map((pond) => (
                            <option
                              key={pond.id}
                              value={pond.id}
                            >
                              {pond.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Feed Quantity (kg)

                        <input
                          name="amount"
                          type="number"
                          min="0.1"
                          step="0.1"
                          required
                        />
                      </label>

                      <label>
                        Date

                        <input
                          name="date"
                          type="date"
                          defaultValue={today()}
                          required
                        />
                      </label>

                      <div className="form-actions">
                        <Button type="submit">
                          Save Record
                        </Button>

                        <Button
                          outline
                          onClick={() => setShowFeedForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {recentFeedings.length === 0 ? (
                    <Empty
                      title="No feeding records"
                      description="Record your first feeding activity."
                      icon="🌾"
                    />
                  ) : (
                    recentFeedings.map((record) => (
                      <div
                        className="record-row"
                        key={record.id}
                      >
                        <span className="record-icon">🌾</span>

                        <div className="record-main">
                          <strong>
                            {
                              data.ponds.find(
                                (pond) => pond.id === record.pondId
                              )?.name
                            }
                          </strong>

                          <small>{record.date}</small>
                        </div>

                        <strong>{record.amount} kg</strong>
                      </div>
                    ))
                  )}
                </section>
              )}

              {/* WATER MONITORING TAB */}

              {farmTab === "water" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Water Monitoring</h2>
                      <p>Record water quality measurements.</p>
                    </div>

                    <Button
                      disabled={!data.ponds.length}
                      onClick={() =>
                        setShowReadingForm((old) => !old)
                      }
                    >
                      + Add Reading
                    </Button>
                  </div>

                  {showReadingForm && (
                    <form
                      className="entry-form"
                      onSubmit={addReading}
                    >
                      <h3>New Water Reading</h3>

                      <label>
                        Pond

                        <select
                          name="pondId"
                          required
                          defaultValue=""
                        >
                          <option value="">Choose a pond</option>

                          {data.ponds.map((pond) => (
                            <option
                              key={pond.id}
                              value={pond.id}
                            >
                              {pond.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="form-two">
                        <label>
                          Temperature (°C)

                          <input
                            name="temperature"
                            type="number"
                            step="0.1"
                            required
                          />
                        </label>

                        <label>
                          Dissolved Oxygen (mg/L)

                          <input
                            name="oxygen"
                            type="number"
                            step="0.1"
                            required
                          />
                        </label>

                        <label>
                          pH

                          <input
                            name="ph"
                            type="number"
                            step="0.1"
                            required
                          />
                        </label>

                        <label>
                          Water Level (m)

                          <input
                            name="level"
                            type="number"
                            step="0.1"
                            required
                          />
                        </label>
                      </div>

                      <div className="form-actions">
                        <Button type="submit">
                          Save Reading
                        </Button>

                        <Button
                          outline
                          onClick={() => setShowReadingForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {recentReadings.length === 0 ? (
                    <Empty
                      title="No water readings"
                      description="Add a reading manually. Sensor data can be integrated later."
                      icon="💧"
                    />
                  ) : (
                    recentReadings.map((reading) => (
                      <div
                        className="record-row"
                        key={reading.id}
                      >
                        <span className="record-icon">💧</span>

                        <div className="record-main">
                          <strong>
                            {
                              data.ponds.find(
                                (pond) => pond.id === reading.pondId
                              )?.name
                            }
                          </strong>

                          <small>
                            {new Date(reading.date).toLocaleString()}
                          </small>

                          <small>
                            {reading.temperature}°C ·{" "}
                            {reading.oxygen} mg/L DO · pH{" "}
                            {reading.ph} · {reading.level} m
                          </small>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="notice">
                    These readings are entered manually. ESP32 sensor
                    integration can be added later.
                  </div>
                </section>
              )}

              {/* POND SIMULATION TAB */}
              {farmTab === "simulation" && (
                <>
                  <section className="simulation-intro">
                    <div>
                      <span className="eyebrow">FISHLINK RESEARCH TOOL</span>
                      <h2>Plan a pond cycle before you commit resources.</h2>
                      <p>Run a simple what-if scenario using your registered pond population, feeding plan and water conditions.</p>
                    </div>
                    <div className="simulation-intro-icon">🧪</div>
                  </section>

                  {data.ponds.length === 0 ? (
                    <Empty title="Add a pond to begin" description="Create a farm and register at least one pond. The simulator uses its fish population as the starting point." icon="🐟" />
                  ) : (
                    <form className="simulation-layout" onSubmit={runPondSimulation}>
                      <section className="panel simulation-form-panel">
                        <div className="panel-heading">
                          <div>
                            <h2>Simulation inputs</h2>
                            <p>Change the assumptions to compare possible outcomes.</p>
                          </div>
                          <span className="simulation-step">01 / INPUTS</span>
                        </div>

                        <label>
                          Pond to simulate
                          <select value={simulationPondId} onChange={(event) => setSimulationPondId(event.target.value)} required>
                            <option value="">Choose a registered pond</option>
                            {data.ponds.map((pond) => (
                              <option key={pond.id} value={pond.id}>{pond.name} · {pond.population.toLocaleString()} fish</option>
                            ))}
                          </select>
                        </label>
                        {simulationPondId && (() => {
                          const selectedPond = data.ponds.find((pond) => pond.id === simulationPondId);
                          return selectedPond ? <div className="simulation-pond-summary"><span>Starting stock</span><strong>{selectedPond.population.toLocaleString()} fish</strong><small>{selectedPond.length} m × {selectedPond.width} m · {data.farms.find((farm) => farm.id === selectedPond.farmId)?.name || "Farm"}</small></div> : null;
                        })()}

                        <div className="simulation-section-title">Growth and feeding assumptions</div>
                        <div className="form-two">
                          <label>Cycle duration (days)<input type="number" min="1" max="365" value={simulationDays} onChange={(e) => setSimulationDays(Number(e.target.value))} required /></label>
                          <label>Starting average weight (g/fish)<input type="number" min="1" step="1" value={simulationStartingWeight} onChange={(e) => setSimulationStartingWeight(Number(e.target.value))} required /></label>
                          <label>Expected daily growth (g/fish/day)<input type="number" min="0" step="0.1" value={simulationDailyGrowth} onChange={(e) => setSimulationDailyGrowth(Number(e.target.value))} required /></label>
                          <label>Feed supplied per day (kg)<input type="number" min="0" step="0.1" value={simulationDailyFeed} onChange={(e) => setSimulationDailyFeed(Number(e.target.value))} required /></label>
                          <label>Baseline daily mortality (%)<input type="number" min="0" max="5" step="0.01" value={simulationMortality} onChange={(e) => setSimulationMortality(Number(e.target.value))} required /></label>
                        </div>

                        <div className="simulation-section-title">Water condition assumptions</div>
                        <div className="form-three">
                          <label>Temperature (°C)<input type="number" min="0" max="50" step="0.1" value={simulationTemperature} onChange={(e) => setSimulationTemperature(Number(e.target.value))} required /></label>
                          <label>Dissolved oxygen (mg/L)<input type="number" min="0" max="30" step="0.1" value={simulationOxygen} onChange={(e) => setSimulationOxygen(Number(e.target.value))} required /></label>
                          <label>pH<input type="number" min="0" max="14" step="0.1" value={simulationPh} onChange={(e) => setSimulationPh(Number(e.target.value))} required /></label>
                        </div>
                        <div className="form-actions simulation-actions">
                          <Button type="submit">▶ Run Simulation</Button>
                          <Button outline onClick={() => { setSimulationDays(90); setSimulationStartingWeight(50); setSimulationDailyGrowth(2); setSimulationDailyFeed(1); setSimulationMortality(0.1); setSimulationTemperature(28); setSimulationOxygen(6); setSimulationPh(7.2); }}>Reset assumptions</Button>
                        </div>
                      </section>

                      <aside className="simulation-side-note">
                        <span className="simulation-side-icon">ℹ️</span>
                        <strong>How this model works</strong>
                        <p>This first version is a deterministic planning calculator. It estimates survival, biomass, feed use and feed conversion from the assumptions entered.</p>
                        <p>It is not yet a validated biological model and does not replace water testing or veterinary advice. A backend model can later replace the calculation without changing this page's inputs.</p>
                        <div className="simulation-api-note"><strong>Backend-ready data</strong><code>POST /api/simulations</code><small>Inputs and results are stored as a structured simulation run.</small></div>
                      </aside>
                    </form>
                  )}

                  {data.simulationRuns[0] && (
                    <section className="panel simulation-results">
                      <div className="panel-heading">
                        <div><h2>Latest simulation results</h2><p>Projected outcomes from the assumptions you entered.</p></div>
                        <span className="status-pill">Completed</span>
                      </div>
                      <div className="metric-grid simulation-metrics">
                        <Metric icon="🐟" label="Projected survivors" value={data.simulationRuns[0].projectedSurvivors.toLocaleString()} sub="Estimated fish remaining" />
                        <Metric icon="⚖️" label="Projected biomass" value={`${data.simulationRuns[0].projectedBiomassKg.toLocaleString()} kg`} sub="Estimated total live weight" />
                        <Metric icon="🌾" label="Total feed" value={`${data.simulationRuns[0].totalFeedKg.toLocaleString()} kg`} sub="Daily feed × cycle duration" />
                        <Metric icon="📊" label="Estimated FCR" value={data.simulationRuns[0].estimatedFcr.toFixed(2)} sub="Feed / estimated biomass gain" />
                      </div>
                      {data.simulationRuns[0].warnings.length > 0 ? (
                        <div className="simulation-warnings"><strong>Conditions to review</strong>{data.simulationRuns[0].warnings.map((warning, index) => <p key={index}>⚠️ {warning}</p>)}</div>
                      ) : (
                        <div className="simulation-good-note">✓ No water-condition warnings were triggered by the simple planning thresholds.</div>
                      )}
                      <p className="simulation-disclaimer">Planning estimate only. Actual growth and survival depend on stocking density, fish strain, feed quality, disease, management and measured water conditions.</p>
                    </section>
                  )}

                  {data.simulationRuns.length > 0 && (
                    <section className="panel simulation-history">
                      <div className="panel-heading">
                        <div><h2>Simulation history</h2><p>Your latest saved scenarios.</p></div>
                        <span className="simulation-step">{data.simulationRuns.length} RUN(S)</span>
                      </div>
                      {data.simulationRuns.slice(0, 8).map((run) => {
                        const pond = data.ponds.find((item) => item.id === run.pondId);
                        return (
                          <article className="simulation-history-row" key={run.id}>
                            <div className="simulation-history-icon">📈</div>
                            <div className="simulation-history-main"><strong>{pond?.name || "Deleted pond"}</strong><small>{run.durationDays} days · {new Date(run.createdAt).toLocaleString()}</small><small>{run.projectedSurvivors.toLocaleString()} projected survivors · {run.projectedBiomassKg.toLocaleString()} kg biomass</small></div>
                            <strong className="simulation-fcr">FCR {run.estimatedFcr.toFixed(2)}</strong>
                          </article>
                        );
                      })}
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {/* MARKETPLACE */}

          {page === "marketplace" && (
            <>
              <Heading
                title="Marketplace"
                description="Discover fish, feed, fingerlings, equipment and farming services."
              />

              <section className="panel">
                <input
                  className="search-box"
                  placeholder="Search products and services..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                <div className="category-grid">
                  {categories.map((item) => (
                    <button
                      key={item}
                      className={`category-button ${
                        category === item ? "chosen" : ""
                      }`}
                      onClick={() => setCategory(item)}
                    >
                      <span>
                        {
                          {
                            All: "🌐",
                            Fish: "🐟",
                            Feed: "🌾",
                            Fingerlings: "🐠",
                            Equipment: "⚙️",
                            Services: "🛠️",
                          }[item]
                        }
                      </span>

                      {item}
                    </button>
                  ))}
                </div>

                {isSeller && (
                  <form
                    className="entry-form"
                    onSubmit={addListing}
                  >
                    <h3>Publish a Listing</h3>

                    <label>
                      Product or Service

                      <input
                        name="productName"
                        required
                        placeholder="What are you selling?"
                      />
                    </label>

                    <div className="form-two">
                      <label>
                        Category

                        <select name="category">
                          {categories
                            .filter((item) => item !== "All")
                            .map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                        </select>
                      </label>

                      <label>
                        Price (₦)

                        <input
                          name="price"
                          type="number"
                          min="1"
                          required
                        />
                      </label>
                    </div>

                    <label>
                      Description

                      <input
                        name="description"
                        placeholder="Product details"
                      />
                    </label>

                    <Button type="submit">
                      Publish Listing
                    </Button>
                  </form>
                )}

                <div className="panel-heading">
                  <div>
                    <h2>Featured Products</h2>
                    <p>
                      {visibleListings.length} items available
                    </p>
                  </div>
                </div>

                {visibleListings.length === 0 ? (
                  <Empty
                    title="No matching products"
                    description="Try another category or search."
                    icon="🛒"
                  />
                ) : (
                  <div className="listing-grid">
                    {visibleListings.map((listing) => (
                      <article
                        className="listing-card"
                        key={listing.id}
                      >
                        <div className="listing-art">
                          {listing.emoji}
                        </div>

                        <div className="listing-body">
                          <span className="category-pill">
                            {listing.category}
                          </span>

                          <h3>{listing.name}</h3>

                          <p>{listing.description}</p>

                          <strong>{money(listing.price)}</strong>

                          <small>
                            Seller: {listing.seller}
                          </small>

                          <Button
                            outline
                            onClick={() =>
                              notify(
                                "Seller contact and ordering will be enabled with the backend."
                              )
                            }
                          >
                            Contact Seller
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="notice">
                  Featured products are illustrative prototype listings,
                  not verified live seller offers.
                </div>
              </section>
            </>
          )}

          {/* COMMUNITY */}

          {page === "community" && (
            <>
              <Heading
                title="Community"
                description="Connect with farmers, experts and fish farming professionals."
              />

              <section className="community-banner">
                <span>🌱</span>

                <div>
                  <h2>Grow Together</h2>

                  <p>
                    Share experiences, ask questions and learn from
                    the FishLink community.
                  </p>
                </div>
              </section>

              <section className="panel">
                <div className="chat-heading">
                  <span className="record-icon">💬</span>

                  <div>
                    <h2>Farmers Group</h2>
                    <small>
                      Community preview · Local prototype
                    </small>
                  </div>
                </div>

                <div className="chat-messages">
                  {data.messages.map((message) => (
                    <div
                      className={`chat-message ${
                        message.mine ? "mine" : ""
                      }`}
                      key={message.id}
                    >
                      <strong>
                        {message.sender}{" "}
                        <small>{message.role}</small>
                      </strong>

                      <p>{message.text}</p>

                      <small>{message.date}</small>
                    </div>
                  ))}
                </div>

                <form
                  className="chat-form"
                  onSubmit={sendMessage}
                >
                  <input
                    value={chatText}
                    onChange={(event) =>
                      setChatText(event.target.value)
                    }
                    placeholder="Write a message..."
                    aria-label="Community message"
                  />

                  <Button type="submit">Send ➤</Button>
                </form>
              </section>

              <section className="panel ai-panel">
                <div className="ai-icon">🤖</div>

                <div>
                  <h2>FishLink AI Assistant</h2>

                  <p>
                    Ask about feeding, water quality, catfish growth
                    and pond management.
                  </p>

                  <Button
                    onClick={() =>
                      notify(
                        "AI answers will be enabled when an AI backend is connected."
                      )
                    }
                  >
                    Open AI Assistant
                  </Button>
                </div>
              </section>
            </>
          )}

          {/* PROFILE */}

          {page === "profile" && (
            <>
              <Heading
                title="My Profile"
                description="Your FishLink account and preferences."
              />

              <section className="panel">
                <div className="profile-intro">
                  <span className="profile-avatar">
                    {data.user?.name.charAt(0).toUpperCase() || "G"}
                  </span>

                  <div>
                    <h2>{data.user?.name || "Guest"}</h2>

                    <p>{currentRole}</p>

                    <small>
                      {data.user?.email || "Guest account"}
                    </small>

                    {data.user?.phone && (
                      <small>{data.user.phone}</small>
                    )}
                  </div>
                </div>

                <div className="settings-row">
                  <span>Account type</span>

                  <strong>
                    {data.user?.guest
                      ? "Guest"
                      : "Registered prototype"}
                  </strong>
                </div>

                <div className="settings-row">
                  <span>Language</span>
                  <LanguageSelect />
                </div>

                <div className="settings-row">
                  <span>Farms</span>
                  <strong>{data.farms.length}</strong>
                </div>

                <div className="settings-row">
                  <span>Ponds</span>
                  <strong>{data.ponds.length}</strong>
                </div>

                <div className="settings-row">
                  <span>Fish Population</span>
                  <strong>{totalFish.toLocaleString()}</strong>
                </div>

                <Button
                  outline
                  onClick={() => go("farms")}
                >
                  Manage My Farms
                </Button>

                <button
                  className="button button-outline logout-full danger"
                  onClick={logout}
                >
                    {t("logout")}
                </button>
              </section>
            </>
          )}

          <footer className="app-footer">
            FishLink · Connect · Learn · Grow
          </footer>
        </div>
      </main>

      {/* MOBILE NAVIGATION */}

      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "active" : ""}
            onClick={() => go(item.id)}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>

      {/* NOTIFICATIONS */}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}