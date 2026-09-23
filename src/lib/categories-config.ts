import type {
  IssueTypeConfig,
  MaintenanceCategory,
  ProblemArea,
  TechnicianSkill,
} from "../types/residence";

export interface CategoryMetadata {
  id: MaintenanceCategory;
  label: string;
  iconName: string; // Lucide icon reference
  description: string;
  primarySkill: TechnicianSkill;
}

export const PROBLEM_AREAS: ProblemArea[] = [
  "My Room",
  "Bathroom 1",
  "Bathroom 2",
  "Kitchen",
  "Common Area",
];

export const MAINTENANCE_CATEGORIES: CategoryMetadata[] = [
  {
    id: "Electrical",
    label: "Electrical",
    iconName: "Zap",
    description: "Lights, switches, power sockets, stoves, breakers",
    primarySkill: "electrical",
  },
  {
    id: "Plumbing",
    label: "Plumbing",
    iconName: "Droplets",
    description: "Sinks, toilets, showers, taps, leaks, geysers",
    primarySkill: "plumbing",
  },
  {
    id: "Furniture",
    label: "Furniture",
    iconName: "Bed",
    description: "Beds, study desks, study chairs, wardrobes",
    primarySkill: "general",
  },
  {
    id: "Doors / Locks",
    label: "Doors / Locks",
    iconName: "KeyRound",
    description: "Room doors, entrance locks, latches, keys, handles",
    primarySkill: "general",
  },
  {
    id: "Blinds / Curtains",
    label: "Blinds / Curtains",
    iconName: "SunMedium",
    description: "Window blinds, cords, curtain rails, tracks",
    primarySkill: "general",
  },
  {
    id: "Bathroom",
    label: "Bathroom",
    iconName: "Bath",
    description: "Toilet seats, mirrors, shower doors, rails",
    primarySkill: "plumbing",
  },
  {
    id: "Kitchen",
    label: "Kitchen",
    iconName: "UtensilsCrossed",
    description: "Cupboard doors, counters, extractor fans",
    primarySkill: "general",
  },
  {
    id: "Carpet / Flooring",
    label: "Carpet / Flooring",
    iconName: "LayoutGrid",
    description: "Tiles, carpet, vinyl lifting, threshold strips",
    primarySkill: "general",
  },
  {
    id: "Cleaning / Basic Maintenance",
    label: "Cleaning / Maintenance",
    iconName: "Sparkles",
    description: "Deep clean required, pest control, bins",
    primarySkill: "general",
  },
  {
    id: "Other",
    label: "Other Issue",
    iconName: "HelpCircle",
    description: "Anything else that needs maintenance attention",
    primarySkill: "general",
  },
];

export const ISSUE_TYPES_BY_CATEGORY: Record<MaintenanceCategory, IssueTypeConfig[]> = {
  Electrical: [
    {
      id: "light_bulb",
      label: "Light bulb",
      category: "Electrical",
      skillRequired: "electrical",
      defaultDescriptionPlaceholder:
        "e.g., The main ceiling light bulb is flickering or completely off.",
    },
    {
      id: "light_switch",
      label: "Light switch",
      category: "Electrical",
      skillRequired: "electrical",
      defaultDescriptionPlaceholder: "e.g., The light switch is stuck or sparking when pressed.",
    },
    {
      id: "power_socket",
      label: "Power socket",
      category: "Electrical",
      skillRequired: "electrical",
      defaultDescriptionPlaceholder:
        "e.g., The wall plug socket has no power or is physically loose.",
    },
    {
      id: "stove",
      label: "Stove / Hot plate",
      category: "Electrical",
      skillRequired: "electrical",
      defaultDescriptionPlaceholder: "e.g., The front-left stove plate is not heating up.",
    },
    {
      id: "circuit_breaker",
      label: "Circuit breaker / Trip switch",
      category: "Electrical",
      skillRequired: "electrical",
      defaultDescriptionPlaceholder: "e.g., The electricity keeps tripping in the unit DB board.",
    },
    {
      id: "electrical_fault",
      label: "Electrical fault",
      category: "Electrical",
      skillRequired: "electrical",
      defaultDescriptionPlaceholder:
        "e.g., Sparks, burning smell, or unexpected power outage in unit.",
    },
    {
      id: "other_electrical",
      label: "Other electrical issue",
      category: "Electrical",
      skillRequired: "electrical",
      defaultDescriptionPlaceholder: "e.g., Describe the electrical problem in detail...",
    },
  ],

  Plumbing: [
    {
      id: "blocked_sink",
      label: "Blocked sink",
      category: "Plumbing",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder:
        "e.g., The kitchen or bathroom sink is blocked and water is not draining.",
    },
    {
      id: "blocked_toilet",
      label: "Blocked toilet",
      category: "Plumbing",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder: "e.g., The toilet is backed up or does not flush properly.",
    },
    {
      id: "shower",
      label: "Shower problem",
      category: "Plumbing",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder:
        "e.g., Shower water is not draining or shower head is spraying sideways.",
    },
    {
      id: "tap_leak",
      label: "Tap / Faucet leak",
      category: "Plumbing",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder:
        "e.g., The tap is constantly dripping or won't turn off completely.",
    },
    {
      id: "pipe_leak",
      label: "Pipe leak",
      category: "Plumbing",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder:
        "e.g., Water is leaking from the pipes under the sink or basin.",
    },
    {
      id: "water_issue",
      label: "Water issue / Low pressure",
      category: "Plumbing",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder:
        "e.g., No hot water in geyser or extremely low water pressure.",
    },
    {
      id: "other_plumbing",
      label: "Other plumbing issue",
      category: "Plumbing",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder: "e.g., Describe the water or plumbing issue...",
    },
  ],

  Furniture: [
    {
      id: "broken_bed",
      label: "Broken bed",
      category: "Furniture",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., The bed base or slats are cracked and unstable.",
    },
    {
      id: "broken_desk",
      label: "Broken desk",
      category: "Furniture",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., The study desk leg is wobbly or the drawer is jammed.",
    },
    {
      id: "broken_chair",
      label: "Broken chair",
      category: "Furniture",
      skillRequired: "general",
      defaultDescriptionPlaceholder:
        "e.g., The study chair backrest is snapped or wheels fallen off.",
    },
    {
      id: "wardrobe",
      label: "Wardrobe / Cupboard",
      category: "Furniture",
      skillRequired: "general",
      defaultDescriptionPlaceholder:
        "e.g., The wardrobe door has fallen off the hinges or shelf collapsed.",
    },
    {
      id: "other_furniture",
      label: "Other furniture",
      category: "Furniture",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Describe the furniture issue...",
    },
  ],

  "Doors / Locks": [
    {
      id: "door_handle",
      label: "Door handle loose / broken",
      category: "Doors / Locks",
      skillRequired: "general",
      defaultDescriptionPlaceholder:
        "e.g., The room door handle is spinning loose and difficult to open.",
    },
    {
      id: "lock_stiff",
      label: "Lock stiff / Key sticking",
      category: "Doors / Locks",
      skillRequired: "general",
      defaultDescriptionPlaceholder:
        "e.g., Key gets stuck in the lock cylinder or won't turn smoothly.",
    },
    {
      id: "door_wont_close",
      label: "Door won't close / latch",
      category: "Doors / Locks",
      skillRequired: "general",
      defaultDescriptionPlaceholder:
        "e.g., Door catches against the frame and doesn't shut properly.",
    },
    {
      id: "security_gate",
      label: "Security gate issue",
      category: "Doors / Locks",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Unit entrance security gate lock or hinges damaged.",
    },
    {
      id: "other_door",
      label: "Other door / lock issue",
      category: "Doors / Locks",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Describe the lock or door problem...",
    },
  ],

  "Blinds / Curtains": [
    {
      id: "broken_blind_cord",
      label: "Broken blind cord / mechanism",
      category: "Blinds / Curtains",
      skillRequired: "general",
      defaultDescriptionPlaceholder:
        "e.g., The cord snapped and blinds cannot be raised or lowered.",
    },
    {
      id: "damaged_slats",
      label: "Damaged blind slats",
      category: "Blinds / Curtains",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Several blind slats are bent or snapped.",
    },
    {
      id: "curtain_rail",
      label: "Curtain rail / track",
      category: "Blinds / Curtains",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Curtain track came off the ceiling or wall mounting.",
    },
    {
      id: "other_blinds",
      label: "Other blind / curtain issue",
      category: "Blinds / Curtains",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Describe the window covering issue...",
    },
  ],

  Bathroom: [
    {
      id: "toilet_seat",
      label: "Toilet seat broken / loose",
      category: "Bathroom",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder: "e.g., Toilet seat hinges are broken or detached.",
    },
    {
      id: "shower_door",
      label: "Shower door / curtain rail",
      category: "Bathroom",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder: "e.g., Shower door rollers are off the track.",
    },
    {
      id: "mirror_damaged",
      label: "Bathroom mirror",
      category: "Bathroom",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Bathroom mirror is cracked or coming off the wall.",
    },
    {
      id: "towel_rail",
      label: "Towel rail / accessories",
      category: "Bathroom",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., The towel rail has pulled away from the tiles.",
    },
    {
      id: "other_bathroom",
      label: "Other bathroom issue",
      category: "Bathroom",
      skillRequired: "plumbing",
      defaultDescriptionPlaceholder: "e.g., Describe the bathroom repair needed...",
    },
  ],

  Kitchen: [
    {
      id: "cupboard_hinge",
      label: "Kitchen cupboard hinge",
      category: "Kitchen",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Kitchen cupboard door hanging by one hinge.",
    },
    {
      id: "countertop",
      label: "Countertop / surface",
      category: "Kitchen",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Edge strip peeling or damaged work surface.",
    },
    {
      id: "extractor_fan",
      label: "Extractor fan",
      category: "Kitchen",
      skillRequired: "electrical",
      defaultDescriptionPlaceholder:
        "e.g., Kitchen extractor fan not spinning or making loud rattling noise.",
    },
    {
      id: "other_kitchen",
      label: "Other kitchen issue",
      category: "Kitchen",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Describe the kitchen issue...",
    },
  ],

  "Carpet / Flooring": [
    {
      id: "tile_cracked",
      label: "Cracked / loose floor tile",
      category: "Carpet / Flooring",
      skillRequired: "general",
      defaultDescriptionPlaceholder:
        "e.g., Floor tile is lifted or broken, creating a tripping hazard.",
    },
    {
      id: "flooring_peeling",
      label: "Flooring vinyl peeling",
      category: "Carpet / Flooring",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Vinyl sheeting has lifted near the doorway.",
    },
    {
      id: "carpet_damage",
      label: "Carpet torn / water damage",
      category: "Carpet / Flooring",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Carpet is damp or frayed at the edge.",
    },
    {
      id: "other_flooring",
      label: "Other flooring issue",
      category: "Carpet / Flooring",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Describe the floor problem...",
    },
  ],

  "Cleaning / Basic Maintenance": [
    {
      id: "deep_cleaning",
      label: "Deep cleaning required",
      category: "Cleaning / Basic Maintenance",
      skillRequired: "general",
      defaultDescriptionPlaceholder:
        "e.g., Spill or stain in common area requiring industrial cleaning.",
    },
    {
      id: "pest_control",
      label: "Pest control required",
      category: "Cleaning / Basic Maintenance",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Signs of pests or insects observed in unit kitchen.",
    },
    {
      id: "waste_disposal",
      label: "Waste disposal issue",
      category: "Cleaning / Basic Maintenance",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Unit bin broken or external chute blocked.",
    },
    {
      id: "other_cleaning",
      label: "Other cleaning issue",
      category: "Cleaning / Basic Maintenance",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Describe the cleaning requirement...",
    },
  ],

  Other: [
    {
      id: "general_repair",
      label: "General maintenance / repair",
      category: "Other",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Tell us what is not working in your unit or room...",
    },
    {
      id: "window_glass",
      label: "Window glass / latch",
      category: "Other",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Window handle broken or glass cracked.",
    },
    {
      id: "unlisted_issue",
      label: "Something else",
      category: "Other",
      skillRequired: "general",
      defaultDescriptionPlaceholder: "e.g., Describe what happened and what needs attention...",
    },
  ],
};

export function getIssueTypes(category: MaintenanceCategory): IssueTypeConfig[] {
  return ISSUE_TYPES_BY_CATEGORY[category] || ISSUE_TYPES_BY_CATEGORY.Other;
}

export function getCategoryMeta(category: MaintenanceCategory): CategoryMetadata {
  return (
    MAINTENANCE_CATEGORIES.find((c) => c.id === category) || {
      id: "Other",
      label: "Other Issue",
      iconName: "HelpCircle",
      description: "General residence maintenance",
      primarySkill: "general",
    }
  );
}
