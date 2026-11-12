import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import PondSimulation from "./PondSimulation";
import {
  CUSTOMER_SERVICE,
  isWhatsAppNumber,
  whatsappUrl,
} from "./contact";
import {
  ApiError,
  api,
  clearSession,
  hasSession,
} from "./api/client";
import type {
  ApiFarm,
  ApiFeeding,
  ApiPond,
  ApiReading,
  ApiUser,
  BootstrapData,
} from "./api/types";
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
  turbidityNtu?: number | null;
  date: string;
};

type ListingStatus = "available" | "sold";

type Listing = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  seller: string;
  sellerId?: string;
  sellerPhone?: string;
  status: ListingStatus;
  emoji: string;
};

type Inquiry = {
  id: string;
  listingId: string;
  listingName: string;
  seller: string;
  sellerId?: string;
  sellerPhone?: string;
  buyerName: string;
  buyerPhone: string;
  message: string;
  date: string;
  status: "new" | "responded";
};

type CommunityGroupId =
  | "general"
  | "farmers"
  | "veterinary"
  | "sellers"
  | "enthusiasts";

type Message = {
  id: string;
  sender: string;
  text: string;
  date: string;
  mine?: boolean;
  role?: string;
  group: CommunityGroupId;
};


type AppData = {
  user: User | null;
  language: Language;
  farms: Farm[];
  ponds: Pond[];
  feedings: Feeding[];
  readings: Reading[];
  listings: Listing[];
  messages: Message[];
  inquiries: Inquiry[];
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

const communityGroups: {
  id: CommunityGroupId;
  label: string;
  description: string;
}[] = [
  {
    id: "general",
    label: "General",
    description: "Open discussion for everyone in the FishLink community.",
  },
  {
    id: "farmers",
    label: "Farmers",
    description: "Pond management, feeding, growth and daily production.",
  },
  {
    id: "veterinary",
    label: "Veterinary",
    description: "Fish health, disease prevention and expert guidance.",
  },
  {
    id: "sellers",
    label: "Sellers",
    description: "Feed, fingerlings, equipment and market conversations.",
  },
  {
    id: "enthusiasts",
    label: "Enthusiasts",
    description: "Learning, small-scale growing and shared experience.",
  },
];

const communityGroupForRole = (role?: string): CommunityGroupId => {
  switch (role) {
    case "Fish Farmer":
      return "farmers";
    case "Veterinary Doctor":
      return "veterinary";
    case "Seller / Supplier":
      return "sellers";
    case "Enthusiast":
      return "enthusiasts";
    default:
      return "general";
  }
};

const starterListings: Listing[] = [
  {
    id: "listing-1",
    name: "Live Catfish",
    category: "Fish",
    price: 2500,
    description: "Fresh live catfish available for pickup.",
    seller: "Green Valley Farm",
    status: "available",
    emoji: "🐟",
  },
  {
    id: "listing-2",
    name: "Catfish Feed (15kg)",
    category: "Feed",
    price: 28000,
    description: "Floating feed suitable for growing catfish.",
    seller: "AgroFeed Ltd",
    status: "available",
    emoji: "🌾",
  },
  {
    id: "listing-3",
    name: "Catfish Fingerlings",
    category: "Fingerlings",
    price: 75,
    description: "Healthy fingerlings from a hatchery.",
    seller: "FreshFinger Hatchery",
    status: "available",
    emoji: "🐠",
  },
  {
    id: "listing-4",
    name: "Water Quality Test Kit",
    category: "Equipment",
    price: 18500,
    description: "Test pH and basic pond water conditions.",
    seller: "AquaTech Supplies",
    status: "available",
    emoji: "🧪",
  },
  {
    id: "listing-5",
    name: "Pond Health Consultation",
    category: "Services",
    price: 10000,
    description: "Professional pond assessment and advice.",
    seller: "Dr. Emmanuel",
    status: "available",
    emoji: "🩺",
  },
  {
    id: "listing-6",
    name: "Pond Aerator",
    category: "Equipment",
    price: 65000,
    description: "Aeration equipment for improved oxygenation.",
    seller: "AquaTech Supplies",
    status: "available",
    emoji: "💧",
  },
];

const starterMessages: Message[] = [
  {
    id: "msg-1",
    sender: "FishLink Team",
    role: "Community",
    text: "Welcome. Choose a group above and join the conversation.",
    date: "Today",
    group: "general",
  },
  {
    id: "msg-2",
    sender: "Emmanuel",
    role: "Fish Farmer",
    text: "My pond water became cloudy after feeding. Any suggestions?",
    date: "Today",
    group: "farmers",
  },
  {
    id: "msg-3",
    sender: "Tunde",
    role: "Fish Farmer",
    text: "Check the amount of feed and remove any uneaten feed.",
    date: "Today",
    group: "farmers",
  },
  {
    id: "msg-4",
    sender: "Dr. Emmanuel",
    role: "Veterinary Doctor",
    text: "Good water quality is important. Check dissolved oxygen and ammonia if possible.",
    date: "Yesterday",
    group: "veterinary",
  },
  {
    id: "msg-5",
    sender: "Ebere",
    role: "Fish Farmer",
    text: "What signs should I watch for when fish stop feeding?",
    date: "Yesterday",
    group: "veterinary",
  },
  {
    id: "msg-6",
    sender: "AgroFeed Ltd",
    role: "Seller / Supplier",
    text: "We have floating feed suitable for grow-out ponds. Ask about pellet sizes.",
    date: "Yesterday",
    group: "sellers",
  },
  {
    id: "msg-7",
    sender: "Tola",
    role: "Enthusiast",
    text: "I am planning a small backyard pond. What species is easiest to start with?",
    date: "Yesterday",
    group: "enthusiasts",
  },
];

const initialData: AppData = {
  user: null,
  language: "en",
  farms: [],
  ponds: [],
  feedings: [],
  readings: [],
  listings: starterListings,
  messages: starterMessages,
  inquiries: [],
};

const LOCAL_IMPORT_KEY = "fishlink-local-import-v1";
const LOCAL_CONTENT_KEY = "fishlink-local-content-v1";

const toNumber = (
  value: string | number | null | undefined,
  fallback = 0
): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapApiUser = (user: ApiUser): User => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  otherRole: user.otherRole || undefined,
  guest: Boolean(user.isGuest),
});

const mapApiFarm = (farm: ApiFarm): Farm => ({
  id: farm.id,
  name: farm.name,
  location: farm.location,
});

const mapApiPond = (pond: ApiPond): Pond => ({
  id: pond.id,
  farmId: pond.farmId,
  name: pond.name,
  population: toNumber(pond.population),
  length: toNumber(pond.length),
  width: toNumber(pond.width),
  status: pond.status,
});

const mapApiFeeding = (feeding: ApiFeeding): Feeding => ({
  id: feeding.id,
  pondId: feeding.pondId,
  amount: toNumber(feeding.amount),
  date: feeding.date || feeding.fedAt || new Date().toISOString(),
});

const mapApiReading = (reading: ApiReading): Reading => ({
  id: reading.id,
  pondId: reading.pondId,
  temperature: toNumber(reading.temperature),
  oxygen: toNumber(reading.oxygen),
  ph: toNumber(reading.ph),
  level: toNumber(reading.level),
  turbidityNtu: toOptionalNumber(reading.turbidityNtu),
  date: reading.date || reading.recordedAt || new Date().toISOString(),
});

const normaliseLanguage = (language: string | undefined): Language => {
  if (language === "ha" || language === "yo" || language === "pcm") {
    return language;
  }
  return "en";
};

const bootstrapToAppData = (bootstrap: BootstrapData): Partial<AppData> => ({
  user: mapApiUser(bootstrap.user),
  language: normaliseLanguage(bootstrap.language),
  farms: (bootstrap.farms || []).map(mapApiFarm),
  ponds: (bootstrap.ponds || []).map(mapApiPond),
  feedings: (bootstrap.feedings || []).map(mapApiFeeding),
  readings: (bootstrap.readings || []).map(mapApiReading),
});

const hasLocalRecords = (data: AppData): boolean =>
  data.farms.length > 0 ||
  data.ponds.length > 0 ||
  data.feedings.length > 0 ||
  data.readings.length > 0;

const loadLocalImportData = (fallback: AppData): AppData | null => {
  try {
    const saved = localStorage.getItem(LOCAL_IMPORT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppData;
      if (hasLocalRecords(parsed)) return parsed;
    }
  } catch {
    // Ignore a malformed local backup.
  }
  return hasLocalRecords(fallback) ? fallback : null;
};

const describeError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.details && typeof error.details === "object") {
      const values = Object.values(error.details as Record<string, unknown>);
      const first = values.find((value) => typeof value === "string");
      if (typeof first === "string") return first;
      for (const value of values) {
        if (Array.isArray(value) && typeof value[0] === "string") {
          return value[0];
        }
      }
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
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

const withListingDefaults = (listing: Listing): Listing => ({
  ...listing,
  status: listing.status === "sold" ? "sold" : "available",
});

const withMessageGroup = (message: Message): Message => ({
  ...message,
  group: message.group || "general",
});

function readLocalContent(): {
  listings: Listing[];
  messages: Message[];
  inquiries: Inquiry[];
} | null {
  try {
    const saved = localStorage.getItem(LOCAL_CONTENT_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    return {
      listings: Array.isArray(parsed.listings)
        ? parsed.listings.map(withListingDefaults)
        : [],
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.map(withMessageGroup)
        : [],
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
    };
  } catch {
    return null;
  }
}

function readSavedData(): AppData {
  try {
    const saved = localStorage.getItem("fishlink-data-v2");
    const localContent = readLocalContent();

    if (!saved && !localContent) return initialData;

    const parsed = saved ? JSON.parse(saved) : {};
    const rawListings: Listing[] = localContent
      ? localContent.listings
      : parsed.listings?.length
      ? parsed.listings
      : starterListings;
    const rawMessages: Message[] = localContent
      ? localContent.messages
      : parsed.messages?.length
      ? parsed.messages
      : starterMessages;

    return {
      ...initialData,
      ...parsed,
      listings: rawListings.map(withListingDefaults),
      messages: rawMessages.map(withMessageGroup),
      inquiries: localContent?.inquiries || parsed.inquiries || [],
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

  const [showFarmForm, setShowFarmForm] = useState(false);
  const [showPondForm, setShowPondForm] = useState(false);
  const [showFeedForm, setShowFeedForm] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);

  const [selectedFarm, setSelectedFarm] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [contactListingId, setContactListingId] = useState<string | null>(null);
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [chatText, setChatText] = useState("");
  const [communityGroup, setCommunityGroup] =
    useState<CommunityGroupId>("general");
  const [toast, setToast] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Track | "">("");

  const [loginEmail, setLoginEmail] = useState(
    localStorage.getItem("fishlink-remembered-email") || ""
  );

  const [busy, setBusy] = useState(false);
  const [localImportDone, setLocalImportDone] = useState(false);
  const [localSnapshot] = useState<AppData>(() => readSavedData());

  const t = (key: string) =>
    translations[data.language]?.[key] ?? translations.en[key] ?? key;

  useEffect(() => {
    localStorage.setItem(
      LOCAL_CONTENT_KEY,
      JSON.stringify({
        listings: data.listings,
        messages: data.messages,
        inquiries: data.inquiries,
      })
    );

    if (!hasSession()) {
      localStorage.setItem("fishlink-data-v2", JSON.stringify(data));
    }
  }, [data]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(""), 2800);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!contactListingId && !showCustomerService) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setContactListingId(null);
      setShowCustomerService(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [contactListingId, showCustomerService]);

  const notify = (message: string) => setToast(message);

  const update = (changes: Partial<AppData>) =>
    setData((old) => ({ ...old, ...changes }));

  const backendUser = Boolean(data.user && !data.user.guest && hasSession());

  useEffect(() => {
    setCommunityGroup(communityGroupForRole(data.user?.role));
  }, [data.user?.role]);
  const localImportData =
    backendUser && !localImportDone
      ? loadLocalImportData(localSnapshot)
      : null;

  useEffect(() => {
    if (!hasSession()) return;

    let cancelled = false;
    setBusy(true);

    if (hasLocalRecords(localSnapshot)) {
      localStorage.setItem(LOCAL_IMPORT_KEY, JSON.stringify(localSnapshot));
    }

    api
      .bootstrap()
      .then((bootstrap) => {
        if (cancelled) return;
        setData((old) => ({ ...old, ...bootstrapToAppData(bootstrap) }));
        localStorage.removeItem("fishlink-data-v2");
        setPage("dashboard");
      })
      .catch((error) => {
        if (cancelled) return;
        clearSession();
        setToast(describeError(error));
        setPage("welcome");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
    // The initial restore runs once; later data changes are handled by explicit actions.
    // eslint-disable-next-line
  }, []);

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

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

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

    setBusy(true);

    try {
      const auth =
        authMode === "register"
          ? await api.register({
              name,
              email,
              password,
              phone,
              role,
              otherRole,
              language: data.language,
            })
          : await api.login(email, password);

      let bootstrap: BootstrapData | null = null;
      try {
        bootstrap = await api.bootstrap();
      } catch {
        bootstrap = null;
      }

      setData((old) => ({
        ...old,
        user: mapApiUser(auth.user),
        ...(bootstrap
          ? bootstrapToAppData(bootstrap)
          : { farms: [], ponds: [], feedings: [], readings: [] }),
      }));

      if (hasLocalRecords(data)) {
        localStorage.setItem(LOCAL_IMPORT_KEY, JSON.stringify(data));
      }
      localStorage.removeItem("fishlink-data-v2");
      setLocalImportDone(false);

      go("dashboard");

      notify(
        bootstrap
          ? authMode === "register"
            ? "Welcome to FishLink!"
            : "Welcome back!"
          : "Signed in, but your records could not be loaded yet."
      );
    } catch (error) {
      notify(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  const continueAsGuest = (role: Track = "Individual") => {
    clearSession();

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

  const logout = async () => {
    if (busy) return;
    const wasGuest = Boolean(data.user?.guest);

    setBusy(true);
    try {
      await api.logout();
    } catch {
      clearSession();
    } finally {
      clearSession();
      setShowPassword(false);
      setLocalImportDone(false);
      update({
        user: null,
        ...(wasGuest
          ? {}
          : { farms: [], ponds: [], feedings: [], readings: [] }),
      });
      go("welcome");
      notify("You have logged out.");
      setBusy(false);
    }
  };

  const importLocalRecords = async () => {
    if (!localImportData || !backendUser || busy) return;

    const confirmed = window.confirm(
      "Import the farm records saved in this browser into your backend account? " +
        "Water levels are treated as percentages; older values recorded in metres cannot be converted automatically."
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const summary = await api.importData({
        farms: localImportData.farms,
        ponds: localImportData.ponds,
        feedings: localImportData.feedings,
        readings: localImportData.readings,
      });
      const bootstrap = await api.bootstrap();
      setData((old) => ({ ...old, ...bootstrapToAppData(bootstrap) }));
      localStorage.removeItem(LOCAL_IMPORT_KEY);
      setLocalImportDone(true);
      notify(
        `Imported ${summary.farms.created} farms, ${summary.ponds.created} ponds, ` +
          `${summary.feedings.created} feedings and ${summary.readings.created} readings.`
      );
    } catch (error) {
      notify(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  // FARM MANAGEMENT
  const addFarm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const name = String(form.get("farmName") || "").trim();
    const location = String(form.get("location") || "").trim();

    if (!name || !location) return;

    if (backendUser) {
      setBusy(true);
      try {
        const farm = mapApiFarm(await api.createFarm({ name, location }));
        update({ farms: [...data.farms, farm] });
        setSelectedFarm(farm.id);
        setShowFarmForm(false);
        formElement.reset();
        notify("Farm added.");
      } catch (error) {
        notify(describeError(error));
      } finally {
        setBusy(false);
      }
      return;
    }

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

    formElement.reset();

    notify("Farm added.");
  };

  const addPond = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

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

    if (backendUser) {
      setBusy(true);
      try {
        const pond = mapApiPond(
          await api.createPond({
            farmId,
            name,
            population,
            length,
            width,
            status: "active",
          })
        );
        update({ ponds: [...data.ponds, pond] });
        setSelectedFarm(farmId);
        setShowPondForm(false);
        formElement.reset();
        notify("Pond added.");
      } catch (error) {
        notify(describeError(error));
      } finally {
        setBusy(false);
      }
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

    formElement.reset();

    notify("Pond added.");
  };

  const deleteFarm = async (id: string) => {
    if (!window.confirm("Delete this farm and its records?")) return;

    const pondIds = data.ponds
      .filter((pond) => pond.farmId === id)
      .map((pond) => pond.id);

    if (backendUser) {
      setBusy(true);
      try {
        await api.deleteFarm(id);
      } catch (error) {
        notify(describeError(error));
        setBusy(false);
        return;
      }
      setBusy(false);
    }

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

  const deletePond = async (id: string) => {
    if (!window.confirm("Delete this pond and its records?")) return;

    if (backendUser) {
      setBusy(true);
      try {
        await api.deletePond(id);
      } catch (error) {
        notify(describeError(error));
        setBusy(false);
        return;
      }
      setBusy(false);
    }

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

  const addFeeding = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const pondId = String(form.get("pondId") || "");
    const amount = Number(form.get("amount"));
    const date = String(form.get("date") || today());

    if (!pondId || amount <= 0) {
      notify("Choose a pond and enter a valid feed amount.");
      return;
    }

    if (backendUser) {
      setBusy(true);
      try {
        const feeding = mapApiFeeding(
          await api.createFeeding({
            pondId,
            amount,
            fedAt: new Date(date).toISOString(),
          })
        );
        update({ feedings: [...data.feedings, feeding] });
        setShowFeedForm(false);
        formElement.reset();
        notify("Feeding record saved.");
      } catch (error) {
        notify(describeError(error));
      } finally {
        setBusy(false);
      }
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

    formElement.reset();

    notify("Feeding record saved.");
  };

  // WATER MONITORING

  const addReading = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const pondId = String(form.get("pondId") || "");
    const temperature = Number(form.get("temperature"));
    const oxygen = Number(form.get("oxygen"));
    const ph = Number(form.get("ph"));
    const level = Number(form.get("level"));
    const rawTurbidity = String(form.get("turbidityNtu") || "").trim();
    const turbidityNtu =
      rawTurbidity === "" ? null : Number(rawTurbidity);

    if (
      !pondId ||
      [temperature, oxygen, ph, level].some(
        (value) => !Number.isFinite(value) || value < 0
      ) ||
      level > 100 ||
      (turbidityNtu !== null &&
        (!Number.isFinite(turbidityNtu) || turbidityNtu < 0))
    ) {
      notify("Enter valid water readings. Water level must be 0–100%.");
      return;
    }

    if (backendUser) {
      setBusy(true);
      try {
        const reading = mapApiReading(
          await api.createReading({
            pondId,
            temperature,
            oxygen,
            ph,
            level,
            turbidityNtu,
            recordedAt: new Date().toISOString(),
            clientId: makeId(),
          })
        );
        update({ readings: [reading, ...data.readings] });
        setShowReadingForm(false);
        formElement.reset();
        notify("Water reading saved.");
      } catch (error) {
        notify(describeError(error));
      } finally {
        setBusy(false);
      }
      return;
    }

    update({
      readings: [
        {
          id: makeId(),
          pondId,
          temperature,
          oxygen,
          ph,
          level,
          turbidityNtu,
          date: new Date().toISOString(),
        },
        ...data.readings,
      ],
    });

    setShowReadingForm(false);

    formElement.reset();

    notify("Water reading saved.");
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
    const sellerPhone = String(form.get("whatsapp") || "").trim();

    if (!name || price <= 0) {
      notify("Enter a product name and valid price.");
      return;
    }

    if (!isWhatsAppNumber(sellerPhone)) {
      notify("Enter a valid WhatsApp number for buyers.");
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
          sellerId: data.user?.email || undefined,
          sellerPhone,
          status: "available",
          emoji: emoji[listingCategory] || "📦",
        },
        ...data.listings,
      ],
    });

    event.currentTarget.reset();

    notify("Listing published with WhatsApp contact.");
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

  const isMyListing = (listing: Listing) =>
    Boolean(
      data.user &&
        (listing.sellerId
          ? listing.sellerId === data.user.email
          : listing.seller === data.user.name)
    );

  const myListings = data.listings.filter(isMyListing);

  const sellerWhatsApp =
    data.user?.phone ||
    myListings.find((listing) => listing.sellerPhone)?.sellerPhone ||
    "";

  const myInquiries = data.inquiries.filter((inquiry) =>
    data.user
      ? inquiry.sellerId
        ? inquiry.sellerId === data.user.email
        : inquiry.seller === data.user.name
      : false
  );

  const newInquiryCount = myInquiries.filter(
    (inquiry) => inquiry.status === "new"
  ).length;

  const contactListing =
    data.listings.find((listing) => listing.id === contactListingId) || null;

  const listingInquiryMessage = (listing: Listing) =>
    `Hello ${listing.seller}, I am interested in ${listing.name} (${money(
      listing.price
    )}) listed on FishLink. Is it still available?`;

  const sendInquiry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contactListing) return;

    const form = new FormData(event.currentTarget);
    const buyerName = String(form.get("buyerName") || "").trim();
    const buyerPhone = String(form.get("buyerPhone") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!buyerName || !buyerPhone || message.length < 5) {
      notify("Enter your name, phone number and a short message.");
      return;
    }

    update({
      inquiries: [
        {
          id: makeId(),
          listingId: contactListing.id,
          listingName: contactListing.name,
          seller: contactListing.seller,
          sellerId: contactListing.sellerId,
          sellerPhone: contactListing.sellerPhone,
          buyerName,
          buyerPhone,
          message,
          date: new Date().toISOString(),
          status: "new",
        },
        ...data.inquiries,
      ],
    });

    setContactListingId(null);
    notify(
      contactListing.sellerPhone
        ? "Inquiry saved. Use WhatsApp for a faster reply."
        : "Inquiry saved for FishLink customer service follow-up."
    );
  };

  const toggleListingStatus = (id: string) => {
    const listing = data.listings.find((item) => item.id === id);
    if (!listing) return;

    update({
      listings: data.listings.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "sold" ? "available" : "sold",
            }
          : item
      ),
    });

    notify(
      listing.status === "sold"
        ? "Listing is available again."
        : "Listing marked as sold."
    );
  };

  const deleteListing = (id: string) => {
    if (!window.confirm("Delete this listing?")) return;

    update({
      listings: data.listings.filter((listing) => listing.id !== id),
    });

    notify("Listing deleted.");
  };

  const markInquiryResponded = (id: string) => {
    update({
      inquiries: data.inquiries.map((inquiry) =>
        inquiry.id === id
          ? { ...inquiry, status: "responded" as const }
          : inquiry
      ),
    });

    notify("Inquiry marked as handled.");
  };

  // COMMUNITY

  const activeCommunityGroup =
    communityGroups.find((group) => group.id === communityGroup) ??
    communityGroups[0];

  const communityMessages = data.messages.filter(
    (message) => message.group === communityGroup
  );

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
          group: communityGroup,
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
              disabled={busy}
            >
              {busy
                ? "Connecting..."
                : authMode === "login"
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
            Accounts and farm records are saved by the FishLink
            backend. Guest mode stays local to this browser.
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
            <button
              className="support-button"
              type="button"
              onClick={() => setShowCustomerService(true)}
            >
              Customer Service
            </button>

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
                          value={`${recentReadings[0].level}%`}
                        />
                      </div>
                    )}
                  </section>
                </>
              ) : isSeller ? (
                <>
                  <div className="metric-grid">
                    <Metric
                      icon="🛒"
                      label="My Listings"
                      value={myListings.length}
                    />

                    <Metric
                      icon="📦"
                      label="Active Listings"
                      value={
                        myListings.filter(
                          (listing) => listing.status === "available"
                        ).length
                      }
                    />

                    <Metric
                      icon="👥"
                      label="New Inquiries"
                      value={newInquiryCount}
                    />

                    <Metric
                      icon="📈"
                      label="WhatsApp Contact"
                      value={sellerWhatsApp ? "Ready" : "Add number"}
                    />
                  </div>

                  <section className="panel seller-workspace">
                    <div className="panel-heading">
                      <div>
                        <h2>Seller Tools</h2>
                        <p>
                          Manage your listings, WhatsApp contact and buyer
                          inquiries.
                        </p>
                      </div>

                      <Button onClick={() => go("marketplace")}>
                        Open Marketplace
                      </Button>
                    </div>

                    <div className="settings-row">
                      <span>Account WhatsApp</span>
                      <strong>
                        {sellerWhatsApp || "Set a number when publishing"}
                      </strong>
                    </div>

                    <h3 className="seller-subheading">My Listings</h3>

                    {myListings.length === 0 ? (
                      <Empty
                        title="No listings yet"
                        description="Publish your first product or service from the marketplace."
                        icon="🛒"
                      />
                    ) : (
                      <div className="seller-listings">
                        {myListings.map((listing) => (
                          <div
                            className="seller-listing"
                            key={listing.id}
                          >
                            <span className="seller-listing-icon">
                              {listing.emoji}
                            </span>

                            <div className="seller-listing-copy">
                              <strong>{listing.name}</strong>
                              <small>
                                {listing.category} · {money(listing.price)} ·{" "}
                                {listing.status === "sold"
                                  ? "Sold"
                                  : "Available"}
                              </small>
                              {listing.sellerPhone && (
                                <small>WhatsApp: {listing.sellerPhone}</small>
                              )}
                            </div>

                            <div className="seller-listing-actions">
                              <button
                                type="button"
                                className="text-button"
                                onClick={() => toggleListingStatus(listing.id)}
                              >
                                {listing.status === "sold"
                                  ? "Relist"
                                  : "Mark sold"}
                              </button>

                              <button
                                type="button"
                                className="text-button danger"
                                onClick={() => deleteListing(listing.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <h3 className="seller-subheading">Buyer Inquiries</h3>

                    {myInquiries.length === 0 ? (
                      <Empty
                        title="No inquiries yet"
                        description="Buyer questions from the marketplace will appear here."
                        icon="💬"
                      />
                    ) : (
                      <div className="inquiry-list">
                        {myInquiries.map((inquiry) => (
                          <article className="inquiry-card" key={inquiry.id}>
                            <div className="inquiry-copy">
                              <div className="inquiry-title">
                                <strong>{inquiry.buyerName}</strong>
                                <span
                                  className={`status-pill ${inquiry.status}`}
                                >
                                  {inquiry.status === "new"
                                    ? "New"
                                    : "Handled"}
                                </span>
                              </div>

                              <small>
                                {inquiry.listingName} ·{" "}
                                {new Date(inquiry.date).toLocaleString()}
                              </small>

                              <p>{inquiry.message}</p>

                              <small>Buyer phone: {inquiry.buyerPhone}</small>
                            </div>

                            <div className="inquiry-actions">
                              <a
                                className="button button-primary button-whatsapp"
                                href={whatsappUrl(
                                  inquiry.buyerPhone,
                                  `Hello ${inquiry.buyerName}, thank you for your FishLink inquiry about ${inquiry.listingName}.`
                                )}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Reply on WhatsApp
                              </a>

                              {inquiry.status === "new" && (
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() =>
                                    markInquiryResponded(inquiry.id)
                                  }
                                >
                                  Mark handled
                                </button>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
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
                          Water Level (%)

                          <input
                            name="level"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            required
                          />
                        </label>

                        <label>
                          Turbidity (NTU, optional)

                          <input
                            name="turbidityNtu"
                            type="number"
                            min="0"
                            step="0.1"
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
                            {reading.ph} · {reading.level}%
                            {reading.turbidityNtu !== null &&
                            reading.turbidityNtu !== undefined
                              ? ` · ${reading.turbidityNtu} NTU`
                              : ""}
                          </small>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="notice">
                    Readings saved to your account are available to the
                    live pond visualization. Water level is stored as a
                    percentage from 0 to 100.
                  </div>
                </section>
              )}

              {/* POND SIMULATION TAB: animation is supplied by the simulation team */}
              {farmTab === "simulation" && (
                <PondSimulation
                  farms={data.farms}
                  ponds={data.ponds}
                />
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

                    <label>
                      WhatsApp Number

                      <input
                        name="whatsapp"
                        type="tel"
                        inputMode="tel"
                        defaultValue={data.user?.phone || ""}
                        placeholder="e.g. 0803 123 4567"
                        required
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
                          <div className="listing-meta">
                            <span className="category-pill">
                              {listing.category}
                            </span>

                            {listing.status === "sold" && (
                              <span className="status-pill sold">Sold</span>
                            )}
                          </div>

                          <h3>{listing.name}</h3>

                          <p>{listing.description}</p>

                          <strong>{money(listing.price)}</strong>

                          <small>
                            Seller: {listing.seller}
                          </small>

                          <div className="listing-actions">
                            <Button
                              outline
                              onClick={() =>
                                setContactListingId(listing.id)
                              }
                            >
                              Contact Seller
                            </Button>

                            {listing.sellerPhone && (
                              <a
                                className="button button-whatsapp"
                                href={whatsappUrl(
                                  listing.sellerPhone,
                                  listingInquiryMessage(listing)
                                )}
                                target="_blank"
                                rel="noreferrer"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
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

              <div
                className="community-groups"
                role="tablist"
                aria-label="Community groups"
              >
                {communityGroups.map((group) => {
                  const count = data.messages.filter(
                    (message) => message.group === group.id
                  ).length;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      role="tab"
                      aria-selected={communityGroup === group.id}
                      className={`community-group ${
                        communityGroup === group.id ? "active" : ""
                      }`}
                      onClick={() => {
                        setCommunityGroup(group.id);
                        setChatText("");
                      }}
                      title={group.description}
                    >
                      <strong>{group.label}</strong>
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>

              <section className="panel">
                <div className="chat-heading">
                  <span className="record-icon">💬</span>

                  <div>
                    <h2>{activeCommunityGroup.label} Group</h2>
                    <small>
                      {activeCommunityGroup.description} · Local prototype
                    </small>
                  </div>
                </div>

                <div className="chat-messages">
                  {communityMessages.length === 0 ? (
                    <div className="chat-empty">
                      No messages in this group yet. Start the conversation.
                    </div>
                  ) : (
                    communityMessages.map((message) => (
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
                    ))
                  )}
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
                    placeholder={`Message the ${activeCommunityGroup.label.toLowerCase()} group...`}
                    aria-label={`Message the ${activeCommunityGroup.label} group`}
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
                    {data.user?.guest ? "Guest" : "Registered account"}
                  </strong>
                </div>

                <div className="settings-row">
                  <span>Language</span>
                  <LanguageSelect />
                </div>

                <div className="settings-row">
                  <span>Customer service</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setShowCustomerService(true)}
                  >
                    Contact support
                  </button>
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

                {localImportData && (
                  <Button
                    outline
                    onClick={importLocalRecords}
                    disabled={busy}
                  >
                    Import Local Records
                  </Button>
                )}

                <button
                  className="button button-outline logout-full danger"
                  onClick={logout}
                  disabled={busy}
                >
                    {t("logout")}
                </button>
              </section>
            </>
          )}

          <footer className="app-footer">
            <span>FishLink · Connect · Learn · Grow</span>
            <button
              type="button"
              className="footer-support"
              onClick={() => setShowCustomerService(true)}
            >
              Customer Service
            </button>
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

      {/* CONTACT SELLER */}

      {contactListing && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setContactListingId(null)}
        >
          <section
            className="modal contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-seller-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setContactListingId(null)}
              aria-label="Close contact seller"
            >
              ×
            </button>

            <span className="modal-kicker">Contact Seller</span>

            <h2 id="contact-seller-title">{contactListing.seller}</h2>

            <p className="modal-subtitle">
              {contactListing.name} · {money(contactListing.price)}
              {contactListing.status === "sold" ? " · Sold" : ""}
            </p>

            {isMyListing(contactListing) ? (
              <>
                <div className="notice">
                  This is your listing. Manage its status and buyer inquiries
                  from your seller dashboard.
                </div>

                <Button
                  onClick={() => {
                    setContactListingId(null);
                    go("dashboard");
                  }}
                >
                  Open Seller Tools
                </Button>
              </>
            ) : (
              <>
                {contactListing.sellerPhone ? (
                  <>
                    <a
                      className="button button-whatsapp contact-whatsapp"
                      href={whatsappUrl(
                        contactListing.sellerPhone,
                        listingInquiryMessage(contactListing)
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Chat on WhatsApp
                    </a>

                    <p className="contact-number">
                      WhatsApp: {contactListing.sellerPhone}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="notice">
                      This demo seller has no direct WhatsApp number.
                      Contact FishLink customer service and we will help
                      with your inquiry.
                    </div>

                    <a
                      className="button button-whatsapp contact-whatsapp"
                      href={whatsappUrl(
                        CUSTOMER_SERVICE.whatsapp,
                        `Hello FishLink Customer Service, I would like to contact ${contactListing.seller} about ${contactListing.name} listed on FishLink.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Contact Customer Service
                    </a>
                  </>
                )}

                <form
                  className="entry-form contact-form"
                  key={contactListing.id}
                  onSubmit={sendInquiry}
                >
                  <h3>Send an inquiry</h3>

                  <div className="form-two">
                    <label>
                      Your name

                      <input
                        name="buyerName"
                        defaultValue={
                          data.user?.guest ? "" : data.user?.name || ""
                        }
                        required
                      />
                    </label>

                    <label>
                      Your phone

                      <input
                        name="buyerPhone"
                        type="tel"
                        inputMode="tel"
                        defaultValue={
                          data.user?.guest ? "" : data.user?.phone || ""
                        }
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Message

                    <textarea
                      name="message"
                      rows={4}
                      defaultValue={listingInquiryMessage(contactListing)}
                      required
                    />
                  </label>

                  <Button type="submit">Send Inquiry</Button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {/* CUSTOMER SERVICE */}

      {showCustomerService && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setShowCustomerService(false)}
        >
          <section
            className="modal support-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-service-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowCustomerService(false)}
              aria-label="Close customer service"
            >
              ×
            </button>

            <span className="modal-kicker">Customer Service</span>

            <h2 id="customer-service-title">How can we help?</h2>

            <p className="modal-subtitle">
              Contact FishLink for help with accounts, marketplace listings,
              WhatsApp contact or pond records.
            </p>

            <div className="support-actions">
              <a
                className="button button-whatsapp"
                href={whatsappUrl(
                  CUSTOMER_SERVICE.whatsapp,
                  "Hello FishLink Customer Service, I need help with my account."
                )}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp Support
              </a>

              <a
                className="button button-outline"
                href={`tel:${CUSTOMER_SERVICE.phone.replace(/[^\d+]/g, "")}`}
              >
                Call {CUSTOMER_SERVICE.phone}
              </a>

              <a
                className="button button-outline"
                href={`mailto:${CUSTOMER_SERVICE.email}`}
              >
                Email {CUSTOMER_SERVICE.email}
              </a>
            </div>

            <div className="settings-row">
              <span>Support hours</span>
              <strong>{CUSTOMER_SERVICE.hours}</strong>
            </div>

            {CUSTOMER_SERVICE.isDemo && (
              <div className="notice">
                These are demo support details. Set the
                REACT_APP_CUSTOMER_SERVICE_WHATSAPP and
                REACT_APP_CUSTOMER_SERVICE_PHONE environment variables
                before launch.
              </div>
            )}
          </section>
        </div>
      )}

      {/* NOTIFICATIONS */}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}