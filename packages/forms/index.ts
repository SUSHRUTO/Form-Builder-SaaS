import { z } from "zod";

export const pokemonTypes = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export const pokemonTypeSchema = z.enum(pokemonTypes);

export const fieldTypeSchema = z.enum([
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "checkbox",
  "rating",
  "date",
]);

export const formVisibilitySchema = z.enum(["public", "unlisted"]);
export const formStatusSchema = z.enum(["draft", "published", "archived"]);

export const fieldOptionSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(80),
  pokemonHint: z.string().max(140).optional(),
});

export const fieldValidationSchema = z.object({
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  ratingScale: z.number().int().min(2).max(10).default(5).optional(),
  pattern: z.string().max(160).optional(),
});

export const fieldConditionSchema = z.object({
  fieldKey: z.string().min(1),
  operator: z.enum(["equals", "not_equals", "includes"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const slugSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes.");

export const formFieldInputSchema = z.object({
  id: z.string().uuid().optional(),
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/)
    .optional(),
  type: fieldTypeSchema,
  label: z.string().min(2).max(140),
  helpText: z.string().max(280).optional().nullable(),
  placeholder: z.string().max(120).optional().nullable(),
  required: z.boolean().default(false),
  options: z.array(fieldOptionSchema).default([]),
  validations: fieldValidationSchema.default({}),
  conditionalLogic: z.array(fieldConditionSchema).default([]),
});

export const formFieldOutputSchema = formFieldInputSchema.extend({
  id: z.string().uuid(),
  key: z.string(),
  order: z.number().int().nonnegative(),
});

export const formThemeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  pokemonType: pokemonTypeSchema,
  accentColor: z.string(),
  backgroundColor: z.string(),
  cardColor: z.string(),
  textColor: z.string(),
  imageUrl: z.string().url(),
  fontFamily: z.string(),
  aura: z.string(),
});

export const createFormInputSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(700).optional().nullable(),
  slug: slugSchema.optional(),
  visibility: formVisibilitySchema.default("unlisted"),
  themeId: z.string().uuid().optional().nullable(),
  pokemonType: pokemonTypeSchema.default("electric"),
  coverImageUrl: z.string().url().optional().nullable(),
  thankYouTitle: z.string().max(120).optional().nullable(),
  thankYouMessage: z.string().max(500).optional().nullable(),
  notificationEmail: z.string().email().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  responseLimit: z.number().int().positive().optional().nullable(),
  password: z.string().min(4).max(80).optional().nullable(),
  fields: z.array(formFieldInputSchema).min(1).optional(),
});

export const updateFormInputSchema = createFormInputSchema.partial().extend({
  id: z.string().uuid(),
  fields: z.array(formFieldInputSchema).min(1).optional(),
});

export const formSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: formStatusSchema,
  visibility: formVisibilitySchema,
  pokemonType: pokemonTypeSchema,
  coverImageUrl: z.string().url().nullable(),
  theme: formThemeSchema.nullable(),
  responseCount: z.number().int().nonnegative(),
  viewCount: z.number().int().nonnegative(),
  startsCount: z.number().int().nonnegative(),
  completionRate: z.number().nonnegative(),
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
});

export const formDetailSchema = formSummarySchema.extend({
  fields: z.array(formFieldOutputSchema),
  thankYouTitle: z.string().nullable(),
  thankYouMessage: z.string().nullable(),
  notificationEmail: z.string().nullable(),
  expiresAt: z.string().nullable(),
  responseLimit: z.number().int().positive().nullable(),
  passwordProtected: z.boolean(),
  shareUrl: z.string(),
});

export const publicFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  visibility: formVisibilitySchema,
  pokemonType: pokemonTypeSchema,
  coverImageUrl: z.string().url().nullable(),
  fields: z.array(formFieldOutputSchema),
  theme: formThemeSchema.nullable(),
  passwordProtected: z.boolean(),
  thankYouTitle: z.string().nullable(),
  thankYouMessage: z.string().nullable(),
  expiresAt: z.string().nullable(),
  responseLimit: z.number().int().positive().nullable(),
});

export const submitResponseInputSchema = z.object({
  slug: z.string().min(1),
  answers: z.record(z.string(), z.unknown()),
  respondentEmail: z.string().email().optional().nullable(),
  startedAt: z.string().datetime().optional().nullable(),
  password: z.string().optional().nullable(),
  website: z.string().max(0).optional().nullable(),
});

export const submitResponseOutputSchema = z.object({
  responseId: z.string().uuid(),
  thankYouTitle: z.string(),
  thankYouMessage: z.string(),
});

export const authUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  profileImageUrl: z.string().nullable(),
});

export const registerInputSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordInputSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordInputSchema = z.object({
  token: z.string().min(24),
  password: z.string().min(8).max(120),
});

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(120),
});

export const responseRowSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  respondentEmail: z.string().nullable(),
  answers: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()),
  submittedAt: z.string(),
});

export const analyticsSchema = z.object({
  formId: z.string().uuid(),
  views: z.number().int().nonnegative(),
  starts: z.number().int().nonnegative(),
  submissions: z.number().int().nonnegative(),
  completionRate: z.number().nonnegative(),
  topFields: z.array(
    z.object({
      fieldId: z.string(),
      label: z.string(),
      answerCount: z.number().int().nonnegative(),
    }),
  ),
  choiceBreakdown: z.array(
    z.object({
      fieldId: z.string(),
      label: z.string(),
      values: z.array(z.object({ value: z.string(), count: z.number().int().nonnegative() })),
    }),
  ),
  dailyResponses: z.array(z.object({ date: z.string(), count: z.number().int().nonnegative() })),
});

export type PokemonType = z.infer<typeof pokemonTypeSchema>;
export type FieldType = z.infer<typeof fieldTypeSchema>;
export type FormVisibility = z.infer<typeof formVisibilitySchema>;
export type FormStatus = z.infer<typeof formStatusSchema>;
export type FieldOption = z.infer<typeof fieldOptionSchema>;
export type FieldValidation = z.infer<typeof fieldValidationSchema>;
export type FieldCondition = z.infer<typeof fieldConditionSchema>;
export type FormFieldInput = z.infer<typeof formFieldInputSchema>;
export type FormFieldOutput = z.infer<typeof formFieldOutputSchema>;
export type FormTheme = z.infer<typeof formThemeSchema>;
export type FormSummary = z.infer<typeof formSummarySchema>;
export type FormDetail = z.infer<typeof formDetailSchema>;
export type PublicForm = z.infer<typeof publicFormSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 76);
}

export function pokemonImage(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export const ashSeasonJourney = [
  "Season 1: Indigo League",
  "Season 2: Adventures in the Orange Islands",
  "Season 3: The Johto Journeys",
  "Season 4: Johto League Champions",
  "Season 5: Master Quest",
  "Season 6: Advanced",
  "Season 7: Advanced Challenge",
  "Season 8: Advanced Battle",
  "Season 9: Battle Frontier",
  "Season 10: Diamond and Pearl",
  "Season 11: DP Battle Dimension",
  "Season 12: DP Galactic Battles",
  "Season 13: DP Sinnoh League Victors",
  "Season 14: Black and White",
  "Season 15: BW Rival Destinies",
  "Season 16: BW Adventures in Unova",
  "Season 17: XY",
  "Season 18: XY Kalos Quest",
  "Season 19: XYZ",
  "Season 20: Sun and Moon",
  "Season 21: SM Ultra Adventures",
  "Season 22: SM Ultra Legends",
  "Season 23: Journeys",
  "Season 24: Master Journeys",
  "Season 25: Ultimate Journeys",
] as const;

export const ashJourneyRegions = [
  {
    key: "kanto",
    region: "Kanto",
    arc: "Indigo League",
    seasons: "Season 1",
    friends: ["Misty", "Brock"],
    badges: ["Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth"],
    challenge: "Ash earns his first badges, learns trust with Pikachu and discovers the wider Pokemon world.",
  },
  {
    key: "orange",
    region: "Orange Islands",
    arc: "Orange League",
    seasons: "Season 2",
    friends: ["Misty", "Tracey"],
    badges: ["Coral-Eye", "Sea Ruby", "Spike Shell", "Jade Star"],
    challenge: "Island trials, unusual gym rules and the champion battle against Drake.",
  },
  {
    key: "johto",
    region: "Johto",
    arc: "Johto League",
    seasons: "Seasons 3-5",
    friends: ["Misty", "Brock"],
    badges: ["Zephyr", "Hive", "Plain", "Fog", "Storm", "Mineral", "Glacier", "Rising"],
    challenge: "New evolutions, old rivalries and the long road to the Silver Conference.",
  },
  {
    key: "hoenn",
    region: "Hoenn",
    arc: "Advanced Generation",
    seasons: "Seasons 6-8",
    friends: ["May", "Max", "Brock"],
    badges: ["Stone", "Knuckle", "Dynamo", "Heat", "Balance", "Feather", "Mind", "Rain"],
    challenge: "Contests, double battles and a new team rhythm across Hoenn.",
  },
  {
    key: "frontier",
    region: "Kanto Battle Frontier",
    arc: "Battle Frontier",
    seasons: "Season 9",
    friends: ["May", "Max", "Brock"],
    badges: ["Knowledge", "Guts", "Tactics", "Luck", "Spirit", "Ability", "Brave"],
    challenge: "Battle facilities push Ash toward champion-level strategy.",
  },
  {
    key: "sinnoh",
    region: "Sinnoh",
    arc: "Diamond and Pearl",
    seasons: "Seasons 10-13",
    friends: ["Dawn", "Brock"],
    badges: ["Coal", "Forest", "Cobble", "Fen", "Relic", "Mine", "Icicle", "Beacon"],
    challenge: "Paul's rivalry, Team Galactic mysteries and hard-earned evolution arcs.",
  },
  {
    key: "unova",
    region: "Unova",
    arc: "Black and White",
    seasons: "Seasons 14-16",
    friends: ["Iris", "Cilan"],
    badges: ["Trio", "Basic", "Insect", "Bolt", "Quake", "Jet", "Freeze", "Legend"],
    challenge: "A fresh start with new Pokemon, rivals and the road to the Vertress Conference.",
  },
  {
    key: "kalos",
    region: "Kalos",
    arc: "XY and XYZ",
    seasons: "Seasons 17-19",
    friends: ["Serena", "Clemont", "Bonnie"],
    badges: ["Bug", "Cliff", "Rumble", "Plant", "Voltage", "Fairy", "Psychic", "Iceberg"],
    challenge: "Mega evolution, Team Flare and Ash-Greninja's bond phenomenon.",
  },
  {
    key: "alola",
    region: "Alola",
    arc: "Sun and Moon",
    seasons: "Seasons 20-22",
    friends: ["Lillie", "Kiawe", "Mallow", "Lana", "Sophocles"],
    badges: ["Melemele", "Akala", "Ula'ula", "Poni", "Manalo Conference"],
    challenge: "Island trials, Ultra Beasts and Ash's first regional championship.",
  },
  {
    key: "world",
    region: "World Coronation",
    arc: "Journeys",
    seasons: "Seasons 23-25",
    friends: ["Goh", "Chloe"],
    badges: ["Normal Class", "Great Class", "Ultra Class", "Masters Eight"],
    challenge: "Global research, legendary mysteries and the Masters Eight climb.",
  },
] as const;

export type PokemonJourneyEntry = {
  dexId: number;
  name: string;
  primaryType: PokemonType;
  region: string;
  seasonArc: string;
  imageUrl: string;
  feature: string;
  specialPower: string;
};

const nationalDexNames = [
  "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie",
  "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate",
  "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran F", "Nidorina",
  "Nidoqueen", "Nidoran M", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff",
  "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett",
  "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag",
  "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell",
  "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro",
  "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder",
  "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb",
  "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing",
  "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu",
  "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados",
  "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto",
  "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo",
  "Mew", "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr",
  "Sentret", "Furret", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat", "Chinchou",
  "Lanturn", "Pichu", "Cleffa", "Igglybuff", "Togepi", "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy",
  "Ampharos", "Bellossom", "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip", "Skiploom", "Jumpluff", "Aipom",
  "Sunkern", "Sunflora", "Yanma", "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking", "Misdreavus",
  "Unown", "Wobbuffet", "Girafarig", "Pineco", "Forretress", "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull",
  "Qwilfish", "Scizor", "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring", "Slugma", "Magcargo", "Swinub",
  "Piloswine", "Corsola", "Remoraid", "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom", "Kingdra",
  "Phanpy", "Donphan", "Porygon2", "Stantler", "Smeargle", "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby",
  "Miltank", "Blissey", "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar", "Tyranitar", "Lugia", "Ho-Oh",
  "Celebi", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert",
  "Poochyena", "Mightyena", "Zigzagoon", "Linoone", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox", "Lotad",
  "Lombre", "Ludicolo", "Seedot", "Nuzleaf", "Shiftry", "Taillow", "Swellow", "Wingull", "Pelipper", "Ralts",
  "Kirlia", "Gardevoir", "Surskit", "Masquerain", "Shroomish", "Breloom", "Slakoth", "Vigoroth", "Slaking", "Nincada",
  "Ninjask", "Shedinja", "Whismur", "Loudred", "Exploud", "Makuhita", "Hariyama", "Azurill", "Nosepass", "Skitty",
  "Delcatty", "Sableye", "Mawile", "Aron", "Lairon", "Aggron", "Meditite", "Medicham", "Electrike", "Manectric",
  "Plusle", "Minun", "Volbeat", "Illumise", "Roselia", "Gulpin", "Swalot", "Carvanha", "Sharpedo", "Wailmer",
  "Wailord", "Numel", "Camerupt", "Torkoal", "Spoink", "Grumpig", "Spinda", "Trapinch", "Vibrava", "Flygon",
  "Cacnea", "Cacturne", "Swablu", "Altaria", "Zangoose", "Seviper", "Lunatone", "Solrock", "Barboach", "Whiscash",
  "Corphish", "Crawdaunt", "Baltoy", "Claydol", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic",
  "Castform", "Kecleon", "Shuppet", "Banette", "Duskull", "Dusclops", "Tropius", "Chimecho", "Absol", "Wynaut",
  "Snorunt", "Glalie", "Spheal", "Sealeo", "Walrein", "Clamperl", "Huntail", "Gorebyss", "Relicanth", "Luvdisc",
  "Bagon", "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Regirock", "Regice", "Registeel", "Latias",
  "Latios", "Kyogre", "Groudon", "Rayquaza", "Jirachi", "Deoxys", "Turtwig", "Grotle", "Torterra", "Chimchar",
  "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Starly", "Staravia", "Staraptor", "Bidoof", "Bibarel",
  "Kricketot", "Kricketune", "Shinx", "Luxio", "Luxray", "Budew", "Roserade", "Cranidos", "Rampardos", "Shieldon",
  "Bastiodon", "Burmy", "Wormadam", "Mothim", "Combee", "Vespiquen", "Pachirisu", "Buizel", "Floatzel", "Cherubi",
  "Cherrim", "Shellos", "Gastrodon", "Ambipom", "Drifloon", "Drifblim", "Buneary", "Lopunny", "Mismagius", "Honchkrow",
  "Glameow", "Purugly", "Chingling", "Stunky", "Skuntank", "Bronzor", "Bronzong", "Bonsly", "Mime Jr.", "Happiny",
  "Chatot", "Spiritomb", "Gible", "Gabite", "Garchomp", "Munchlax", "Riolu", "Lucario", "Hippopotas", "Hippowdon",
  "Skorupi", "Drapion", "Croagunk", "Toxicroak", "Carnivine", "Finneon", "Lumineon", "Mantyke", "Snover", "Abomasnow",
  "Weavile", "Magnezone", "Lickilicky", "Rhyperior", "Tangrowth", "Electivire", "Magmortar", "Togekiss", "Yanmega", "Leafeon",
  "Glaceon", "Gliscor", "Mamoswine", "Porygon-Z", "Gallade", "Probopass", "Dusknoir", "Froslass", "Rotom", "Uxie",
  "Mesprit", "Azelf", "Dialga", "Palkia", "Heatran", "Regigigas", "Giratina", "Cresselia", "Phione", "Manaphy",
  "Darkrai", "Shaymin", "Arceus", "Victini", "Snivy", "Servine", "Serperior", "Tepig", "Pignite", "Emboar",
  "Oshawott", "Dewott", "Samurott", "Patrat", "Watchog", "Lillipup", "Herdier", "Stoutland", "Purrloin", "Liepard",
  "Pansage", "Simisage", "Pansear", "Simisear", "Panpour", "Simipour", "Munna", "Musharna", "Pidove", "Tranquill",
] as const;

const dexTypeOverrides: Record<number, PokemonType> = {
  1: "grass", 2: "grass", 3: "grass", 4: "fire", 5: "fire", 6: "fire", 7: "water", 8: "water", 9: "water",
  10: "bug", 11: "bug", 12: "bug", 16: "flying", 17: "flying", 18: "flying", 25: "electric", 26: "electric",
  37: "fire", 38: "fire", 39: "fairy", 40: "fairy", 43: "grass", 44: "grass", 45: "grass", 54: "water", 55: "water",
  58: "fire", 59: "fire", 60: "water", 61: "water", 62: "water", 63: "psychic", 64: "psychic", 65: "psychic",
  66: "fighting", 67: "fighting", 68: "fighting", 74: "rock", 75: "rock", 76: "rock", 81: "steel", 82: "steel",
  92: "ghost", 93: "ghost", 94: "ghost", 95: "rock", 104: "ground", 105: "ground", 123: "bug", 125: "electric",
  126: "fire", 129: "water", 130: "water", 131: "water", 133: "normal", 134: "water", 135: "electric", 136: "fire",
  143: "normal", 144: "ice", 145: "electric", 146: "fire", 147: "dragon", 148: "dragon", 149: "dragon",
  150: "psychic", 151: "psychic", 152: "grass", 153: "grass", 154: "grass", 155: "fire", 156: "fire", 157: "fire",
  158: "water", 159: "water", 160: "water", 172: "electric", 175: "fairy", 176: "fairy", 179: "electric",
  180: "electric", 181: "electric", 196: "psychic", 197: "dark", 208: "steel", 212: "steel", 214: "bug",
  229: "dark", 230: "dragon", 243: "electric", 244: "fire", 245: "water", 248: "dark", 249: "psychic",
  250: "fire", 251: "psychic", 252: "grass", 253: "grass", 254: "grass", 255: "fire", 256: "fire", 257: "fire",
  258: "water", 259: "water", 260: "water", 282: "psychic", 302: "dark", 303: "steel", 306: "steel",
  330: "ground", 334: "dragon", 350: "water", 359: "dark", 373: "dragon", 376: "steel", 382: "water",
  383: "ground", 384: "dragon", 385: "steel", 386: "psychic", 387: "grass", 388: "grass", 389: "grass",
  390: "fire", 391: "fire", 392: "fire", 393: "water", 394: "water", 395: "water", 403: "electric",
  404: "electric", 405: "electric", 445: "dragon", 448: "fighting", 462: "steel", 466: "electric",
  467: "fire", 470: "grass", 471: "ice", 475: "psychic", 479: "electric", 483: "steel", 484: "water",
  487: "ghost", 491: "dark", 493: "normal", 494: "fire", 495: "grass", 496: "grass", 497: "grass",
  498: "fire", 499: "fire", 500: "fire", 501: "water", 502: "water", 503: "water",
};

const typePowerCopy: Record<PokemonType, string> = {
  normal: "Adaptive trainer sync and reliable clutch turns",
  fire: "Blaze surges, arena pressure and comeback momentum",
  water: "Tide control, rescue routes and flowing team tactics",
  electric: "Volt speed, signal boosts and instant crowd energy",
  grass: "Growth loops, healing rhythm and terrain control",
  ice: "Frost shields, precision counters and calm focus",
  fighting: "Aura discipline, close-range reads and grit",
  poison: "Status traps, pressure drains and stealthy disruption",
  ground: "Terrain breaks, canyon defense and heavy impact",
  flying: "Aerial scouting, fast pivots and sky-route mobility",
  psychic: "Mind-link clues, prediction and mystery solving",
  bug: "Swarm teamwork, scouting and metamorphosis arcs",
  rock: "Fossil clues, badge resilience and ancient defense",
  ghost: "Shadow puzzles, haunted lore and hidden-path reveals",
  dragon: "Legendary scale, high-risk evolution and mythic force",
  dark: "Night strategy, rivalry tension and surprise reversals",
  steel: "Forge defense, lab upgrades and championship durability",
  fairy: "Bond magic, morale lifts and wonder-filled encounters",
};

function pokemonTypeForDex(dexId: number): PokemonType {
  return dexTypeOverrides[dexId] ?? pokemonTypes[(dexId - 1) % pokemonTypes.length]!;
}

function regionForDex(dexId: number) {
  if (dexId <= 151) return "Kanto";
  if (dexId <= 251) return "Johto";
  if (dexId <= 386) return "Hoenn";
  if (dexId <= 493) return "Sinnoh";
  return "Unova";
}

function seasonForDex(dexId: number) {
  const index = Math.min(ashSeasonJourney.length - 1, Math.floor(((dexId - 1) / nationalDexNames.length) * ashSeasonJourney.length));
  return ashSeasonJourney[index]!;
}

function featureForDex(dexId: number, name: string, type: PokemonType) {
  const arc = dexId % 5 === 0 ? "badge battle" : dexId % 5 === 1 ? "new companion" : dexId % 5 === 2 ? "evolution clue" : dexId % 5 === 3 ? "rival challenge" : "mystery encounter";
  return `${name} becomes a ${type} ${arc} moment in Ash's 25-season route.`;
}

const lateJourneyHighlights: Array<Pick<PokemonJourneyEntry, "dexId" | "name" | "primaryType" | "region" | "seasonArc">> = [
  { dexId: 656, name: "Froakie", primaryType: "water", region: "Kalos", seasonArc: "Season 17: XY" },
  { dexId: 657, name: "Frogadier", primaryType: "water", region: "Kalos", seasonArc: "Season 18: XY Kalos Quest" },
  { dexId: 658, name: "Greninja", primaryType: "water", region: "Kalos", seasonArc: "Season 19: XYZ" },
  { dexId: 661, name: "Fletchling", primaryType: "flying", region: "Kalos", seasonArc: "Season 17: XY" },
  { dexId: 663, name: "Talonflame", primaryType: "fire", region: "Kalos", seasonArc: "Season 18: XY Kalos Quest" },
  { dexId: 701, name: "Hawlucha", primaryType: "fighting", region: "Kalos", seasonArc: "Season 18: XY Kalos Quest" },
  { dexId: 714, name: "Noibat", primaryType: "flying", region: "Kalos", seasonArc: "Season 18: XY Kalos Quest" },
  { dexId: 715, name: "Noivern", primaryType: "dragon", region: "Kalos", seasonArc: "Season 19: XYZ" },
  { dexId: 722, name: "Rowlet", primaryType: "grass", region: "Alola", seasonArc: "Season 20: Sun and Moon" },
  { dexId: 724, name: "Decidueye", primaryType: "grass", region: "Alola", seasonArc: "Season 22: SM Ultra Legends" },
  { dexId: 725, name: "Litten", primaryType: "fire", region: "Alola", seasonArc: "Season 20: Sun and Moon" },
  { dexId: 727, name: "Incineroar", primaryType: "fire", region: "Alola", seasonArc: "Season 22: SM Ultra Legends" },
  { dexId: 744, name: "Rockruff", primaryType: "rock", region: "Alola", seasonArc: "Season 20: Sun and Moon" },
  { dexId: 745, name: "Lycanroc", primaryType: "rock", region: "Alola", seasonArc: "Season 21: SM Ultra Adventures" },
  { dexId: 785, name: "Tapu Koko", primaryType: "electric", region: "Alola", seasonArc: "Season 22: SM Ultra Legends" },
  { dexId: 791, name: "Solgaleo", primaryType: "psychic", region: "Alola", seasonArc: "Season 21: SM Ultra Adventures" },
  { dexId: 793, name: "Nihilego", primaryType: "poison", region: "Alola", seasonArc: "Season 21: SM Ultra Adventures" },
  { dexId: 801, name: "Magearna", primaryType: "steel", region: "Alola", seasonArc: "Season 22: SM Ultra Legends" },
  { dexId: 808, name: "Meltan", primaryType: "steel", region: "Alola", seasonArc: "Season 22: SM Ultra Legends" },
  { dexId: 809, name: "Melmetal", primaryType: "steel", region: "Alola", seasonArc: "Season 22: SM Ultra Legends" },
  { dexId: 813, name: "Scorbunny", primaryType: "fire", region: "Galar", seasonArc: "Season 23: Journeys" },
  { dexId: 815, name: "Cinderace", primaryType: "fire", region: "Galar", seasonArc: "Season 24: Master Journeys" },
  { dexId: 816, name: "Sobble", primaryType: "water", region: "Galar", seasonArc: "Season 23: Journeys" },
  { dexId: 818, name: "Inteleon", primaryType: "water", region: "Galar", seasonArc: "Season 24: Master Journeys" },
  { dexId: 865, name: "Sirfetch'd", primaryType: "fighting", region: "World Coronation", seasonArc: "Season 24: Master Journeys" },
  { dexId: 877, name: "Morpeko", primaryType: "electric", region: "Galar", seasonArc: "Season 23: Journeys" },
  { dexId: 882, name: "Dracovish", primaryType: "water", region: "World Coronation", seasonArc: "Season 24: Master Journeys" },
  { dexId: 887, name: "Dragapult", primaryType: "dragon", region: "Galar", seasonArc: "Season 25: Ultimate Journeys" },
  { dexId: 888, name: "Zacian", primaryType: "fairy", region: "Galar", seasonArc: "Season 25: Ultimate Journeys" },
  { dexId: 890, name: "Eternatus", primaryType: "dragon", region: "Galar", seasonArc: "Season 25: Ultimate Journeys" },
];

export const ashJourneyPokemon: PokemonJourneyEntry[] = [
  ...nationalDexNames.map((name, index) => {
    const dexId = index + 1;
    const primaryType = pokemonTypeForDex(dexId);
    return {
      dexId,
      name,
      primaryType,
      region: regionForDex(dexId),
      seasonArc: seasonForDex(dexId),
      imageUrl: pokemonImage(dexId),
      feature: featureForDex(dexId, name, primaryType),
      specialPower: typePowerCopy[primaryType],
    };
  }),
  ...lateJourneyHighlights.map((pokemon) => ({
    ...pokemon,
    imageUrl: pokemonImage(pokemon.dexId),
    feature: featureForDex(pokemon.dexId, pokemon.name, pokemon.primaryType),
    specialPower: typePowerCopy[pokemon.primaryType],
  })),
];

export const pokemonJourneyStats = {
  pokemonCount: ashJourneyPokemon.length,
  typeCount: pokemonTypes.length,
  seasonCount: ashSeasonJourney.length,
  regions: [...new Set(ashJourneyPokemon.map((pokemon) => pokemon.region))],
};

export const pokemonTypeCoverage = pokemonTypes.map((type) => ({
  type,
  count: ashJourneyPokemon.filter((pokemon) => pokemon.primaryType === type).length,
}));

export function defaultFieldsForType(type: PokemonType): FormFieldInput[] {
  const base: FormFieldInput[] = [
    {
      key: "trainer_name",
      type: "short_text",
      label: "Trainer name",
      placeholder: "Ash Ketchum",
      required: true,
      options: [],
      validations: { minLength: 2, maxLength: 80 },
      conditionalLogic: [],
    },
    {
      key: "contact_email",
      type: "email",
      label: "Contact email",
      placeholder: "trainer@pokemon.world",
      required: true,
      options: [],
      validations: {},
      conditionalLogic: [],
    },
  ];

  const typed: Record<PokemonType, FormFieldInput> = {
    normal: selectField("favorite_partner", "Favorite partner Pokemon", ["Eevee", "Snorlax", "Ditto"]),
    fire: selectField("battle_style", "Preferred fire battle style", ["Blaze rush", "Sunny day setup", "Inferno control"]),
    water: selectField("aquatic_route", "Best water route", ["Cerulean gym", "Hoenn dive trail", "Paldea coast"]),
    electric: selectField("power_source", "Power source", ["Thunder stone", "Static charge", "Volt switch combo"]),
    grass: selectField("growth_plan", "Growth plan", ["Overgrow", "Leech seed loop", "Solar beam finisher"]),
    ice: selectField("frost_move", "Signature frost move", ["Ice beam", "Aurora veil", "Blizzard"]),
    fighting: selectField("dojo_focus", "Dojo focus", ["Counter timing", "Power-up punch", "Aura training"]),
    poison: selectField("toxin_style", "Toxin style", ["Venoshock", "Toxic spikes", "Corrosion"]),
    ground: selectField("terrain", "Favorite terrain", ["Canyon", "Cave", "Desert arena"]),
    flying: selectField("flight_path", "Flight path", ["Sky pillar", "Windy ridge", "Cloud sprint"]),
    psychic: selectField("mind_link", "Mind-link signal", ["Future sight", "Calm mind", "Teleport"]),
    bug: selectField("swarm_role", "Swarm role", ["Scout", "Hive strategist", "Web trapper"]),
    rock: selectField("fossil_pick", "Fossil pick", ["Helix", "Dome", "Old amber"]),
    ghost: selectField("haunt_style", "Haunt style", ["Shadow sneak", "Hex", "Night shade"]),
    dragon: selectField("legend_path", "Legend path", ["Sky ascent", "Ancient cave", "Meteor falls"]),
    dark: selectField("stealth_plan", "Stealth plan", ["Night slash", "Taunt", "Snarl"]),
    steel: selectField("forge_goal", "Forge goal", ["Iron defense", "Magnet rise", "Meteor mash"]),
    fairy: selectField("sparkle_code", "Sparkle code", ["Moonblast", "Misty terrain", "Charm"]),
  };

  return [...base, typed[type], ratingField(), longTextField()];
}

function selectField(key: string, label: string, options: string[]): FormFieldInput {
  return {
    key,
    type: "single_select",
    label,
    required: true,
    options: options.map((option) => ({ label: option, value: slugify(option) })),
    validations: {},
    conditionalLogic: [],
  };
}

function ratingField(): FormFieldInput {
  return {
    key: "arena_rating",
    type: "rating",
    label: "How powerful should this form feel?",
    helpText: "1 is Pidgey practice, 5 is legendary encounter.",
    required: true,
    options: [],
    validations: { ratingScale: 5, min: 1, max: 5 },
    conditionalLogic: [],
  };
}

function longTextField(): FormFieldInput {
  return {
    key: "special_power",
    type: "long_text",
    label: "Describe your special power or team story",
    placeholder: "Tell us what makes your Pokemon world different...",
    required: false,
    options: [],
    validations: { maxLength: 500 },
    conditionalLogic: [],
  };
}

export function buildResponseSchema(fields: ReadonlyArray<FormFieldOutput>) {
  const shape: Record<string, z.ZodType> = {};

  for (const field of fields) {
    let schema = schemaForField(field);
    if (!field.required) {
      schema = schema.optional().or(z.literal("")).or(z.null());
    }
    shape[field.id] = schema;
  }

  return z.object(shape).passthrough();
}

function schemaForField(field: FormFieldOutput): z.ZodType {
  const validations = field.validations ?? {};
  switch (field.type) {
    case "short_text":
    case "long_text": {
      let schema = z.string();
      if (field.required) schema = schema.min(1, `${field.label} is required.`);
      if (validations.minLength) schema = schema.min(validations.minLength);
      if (validations.maxLength) schema = schema.max(validations.maxLength);
      if (validations.pattern) schema = schema.regex(new RegExp(validations.pattern));
      return schema;
    }
    case "email":
      return z.string().email();
    case "number": {
      let schema = z.coerce.number();
      if (typeof validations.min === "number") schema = schema.min(validations.min);
      if (typeof validations.max === "number") schema = schema.max(validations.max);
      return schema;
    }
    case "single_select": {
      const values = field.options.map((option) => option.value);
      return z.string().refine((value) => values.includes(value), "Choose a valid option.");
    }
    case "multi_select": {
      const values = field.options.map((option) => option.value);
      let schema = z.array(z.string().refine((value) => values.includes(value)));
      if (field.required) schema = schema.min(1, `${field.label} is required.`);
      return schema;
    }
    case "checkbox":
      return z.coerce.boolean();
    case "rating": {
      const max = validations.ratingScale ?? validations.max ?? 5;
      return z.coerce.number().min(1).max(max);
    }
    case "date":
      return z.string().min(1);
  }
}

export type PokemonFormTemplate = {
  title: string;
  slug: string;
  description: string;
  pokemonType: PokemonType;
  visibility: FormVisibility;
  themeName: string;
  coverImageUrl: string;
  notificationEmail: string;
  fields: FormFieldInput[];
};

export const samplePokemonThemes: Omit<FormTheme, "id">[] = [
  {
    name: "Pikachu Neon League",
    pokemonType: "electric",
    accentColor: "#ffd84d",
    backgroundColor: "#101820",
    cardColor: "#182331",
    textColor: "#fff7d6",
    imageUrl: pokemonImage(25),
    fontFamily: "Geist",
    aura: "Volt badge circuitry, stadium lights, amber sparks",
  },
  {
    name: "Charizard Ember Arena",
    pokemonType: "fire",
    accentColor: "#ff6b35",
    backgroundColor: "#190c0b",
    cardColor: "#2a1512",
    textColor: "#fff0e8",
    imageUrl: pokemonImage(6),
    fontFamily: "Geist",
    aura: "Lava glass, gym banners, cinematic heat haze",
  },
  {
    name: "Bulbasaur Verdant Lab",
    pokemonType: "grass",
    accentColor: "#76d275",
    backgroundColor: "#071812",
    cardColor: "#10251d",
    textColor: "#edfff4",
    imageUrl: pokemonImage(1),
    fontFamily: "Geist",
    aura: "Greenhouse consoles, leaf glyphs, professor notes",
  },
  {
    name: "Gengar Midnight Arcade",
    pokemonType: "ghost",
    accentColor: "#b883ff",
    backgroundColor: "#12091c",
    cardColor: "#21112f",
    textColor: "#f7ecff",
    imageUrl: pokemonImage(94),
    fontFamily: "Geist",
    aura: "Haunted pixels, dark badges, lavender town glow",
  },
  {
    name: "Lapras Oceanic Voyage",
    pokemonType: "water",
    accentColor: "#63d3ff",
    backgroundColor: "#061827",
    cardColor: "#102a3c",
    textColor: "#ecfbff",
    imageUrl: pokemonImage(131),
    fontFamily: "Geist",
    aura: "Sea charts, aurora waves, gentle ferry routes",
  },
  {
    name: "Indigo League Classic",
    pokemonType: "electric",
    accentColor: "#facc15",
    backgroundColor: "#0b1220",
    cardColor: "#111c2e",
    textColor: "#fff9db",
    imageUrl: pokemonImage(25),
    fontFamily: "Geist",
    aura: "Badge boards, rival screens, first-partner loyalty",
  },
  {
    name: "Orange Islands Voyage",
    pokemonType: "water",
    accentColor: "#22d3ee",
    backgroundColor: "#061520",
    cardColor: "#0d2a38",
    textColor: "#ecfeff",
    imageUrl: pokemonImage(131),
    fontFamily: "Geist",
    aura: "Island trials, wave maps, tropical champion energy",
  },
  {
    name: "Johto Evolution Trail",
    pokemonType: "grass",
    accentColor: "#a3e635",
    backgroundColor: "#08170f",
    cardColor: "#132719",
    textColor: "#f0fdf4",
    imageUrl: pokemonImage(152),
    fontFamily: "Geist",
    aura: "Apricorn paths, Silver Conference lights, evolution clues",
  },
  {
    name: "Hoenn Contest Stage",
    pokemonType: "fire",
    accentColor: "#fb7185",
    backgroundColor: "#170f18",
    cardColor: "#2b1825",
    textColor: "#fff1f2",
    imageUrl: pokemonImage(257),
    fontFamily: "Geist",
    aura: "Contest ribbons, double-battle heat, traveling squad sparks",
  },
  {
    name: "Battle Frontier Circuit",
    pokemonType: "fighting",
    accentColor: "#f97316",
    backgroundColor: "#181208",
    cardColor: "#2b1c0d",
    textColor: "#fff7ed",
    imageUrl: pokemonImage(448),
    fontFamily: "Geist",
    aura: "Facility symbols, tactical callouts, champion practice",
  },
  {
    name: "Sinnoh Mystery Lab",
    pokemonType: "steel",
    accentColor: "#93c5fd",
    backgroundColor: "#07101c",
    cardColor: "#111d2d",
    textColor: "#eff6ff",
    imageUrl: pokemonImage(483),
    fontFamily: "Geist",
    aura: "Spear Pillar scans, Galactic files, evolution research",
  },
  {
    name: "Unova Discovery Route",
    pokemonType: "water",
    accentColor: "#38bdf8",
    backgroundColor: "#081421",
    cardColor: "#102337",
    textColor: "#e0f2fe",
    imageUrl: pokemonImage(501),
    fontFamily: "Geist",
    aura: "Fresh-start route maps, rival cards, new-Pokemon encounters",
  },
  {
    name: "Kalos Bond Phenomenon",
    pokemonType: "dragon",
    accentColor: "#c084fc",
    backgroundColor: "#10091c",
    cardColor: "#21132f",
    textColor: "#faf5ff",
    imageUrl: pokemonImage(658),
    fontFamily: "Geist",
    aura: "Mega evolution auras, Lumiose signals, Ash-Greninja resonance",
  },
  {
    name: "Alola Champion Festival",
    pokemonType: "fire",
    accentColor: "#fbbf24",
    backgroundColor: "#16140a",
    cardColor: "#2a220e",
    textColor: "#fffbeb",
    imageUrl: pokemonImage(727),
    fontFamily: "Geist",
    aura: "Island trial drums, Z-move flashes, Manalo victory lights",
  },
  {
    name: "World Coronation Arena",
    pokemonType: "fighting",
    accentColor: "#60a5fa",
    backgroundColor: "#09111f",
    cardColor: "#111d31",
    textColor: "#eff6ff",
    imageUrl: pokemonImage(448),
    fontFamily: "Geist",
    aura: "Global rankings, Masters Eight boards, final-battle focus",
  },
  {
    name: "Evolution Mystery Archive",
    pokemonType: "psychic",
    accentColor: "#f0abfc",
    backgroundColor: "#130a1b",
    cardColor: "#24112d",
    textColor: "#fdf4ff",
    imageUrl: pokemonImage(150),
    fontFamily: "Geist",
    aura: "Ancient files, lab glass, legendary psychic signals",
  },
  {
    name: "Friends and Rivals Lounge",
    pokemonType: "fairy",
    accentColor: "#f9a8d4",
    backgroundColor: "#160b14",
    cardColor: "#2a1425",
    textColor: "#fdf2f8",
    imageUrl: pokemonImage(175),
    fontFamily: "Geist",
    aura: "Companion memories, rivalry cards, reunion glow",
  },
];

function optionValues(values: string[]) {
  return values.map((value) => ({ label: value, value: slugify(value) }));
}

function journeyTemplateFields(
  type: PokemonType,
  companions: string[],
  milestones: string[],
  mysteryFocus: string,
): FormFieldInput[] {
  return [
    ...defaultFieldsForType(type),
    {
      key: "season_checkpoint",
      type: "single_select",
      label: "Which Ash journey checkpoint is this response about?",
      required: true,
      options: optionValues(milestones),
      validations: {},
      conditionalLogic: [],
    },
    {
      key: "featured_pokemon",
      type: "multi_select",
      label: "Which Pokemon should appear in this chapter?",
      required: true,
      options: optionValues(companions),
      validations: {},
      conditionalLogic: [],
    },
    {
      key: "badge_count",
      type: "number",
      label: "Badges or major wins earned so far",
      placeholder: "8",
      required: true,
      options: [],
      validations: { min: 0, max: 12 },
      conditionalLogic: [],
    },
    {
      key: "challenge_date",
      type: "date",
      label: "Journey or event date",
      required: false,
      options: [],
      validations: {},
      conditionalLogic: [],
    },
    {
      key: "mystery_thread",
      type: "long_text",
      label: mysteryFocus,
      placeholder: "Describe the clue, bond, evolution trigger or rival moment...",
      required: false,
      options: [],
      validations: { maxLength: 700 },
      conditionalLogic: [],
    },
    {
      key: "share_with_explore",
      type: "checkbox",
      label: "This story can be featured in public explore",
      required: false,
      options: [],
      validations: {},
      conditionalLogic: [],
    },
  ];
}

export const ashJourneyFormTemplates: PokemonFormTemplate[] = [
  {
    title: "Ash's Indigo League Chapter Builder",
    slug: "ash-indigo-league-chapter-builder",
    description:
      "Create a public story form for Ash's first Kanto badges, Pikachu loyalty, rival battles and the Indigo League climb.",
    pokemonType: "electric",
    visibility: "public",
    themeName: "Indigo League Classic",
    coverImageUrl: pokemonImage(25),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("electric", ["Pikachu", "Butterfree", "Pidgeotto", "Bulbasaur", "Charizard", "Squirtle"], ["Pallet Town", "Boulder Badge", "Cascade Badge", "Thunder Badge", "Indigo Plateau"], "What made this Kanto moment iconic?"),
  },
  {
    title: "Orange Islands Trial Quest",
    slug: "orange-islands-trial-quest",
    description:
      "Collect island challenge entries with Lapras routes, Drake prep and tropical trial rules.",
    pokemonType: "water",
    visibility: "public",
    themeName: "Orange Islands Voyage",
    coverImageUrl: pokemonImage(131),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("water", ["Lapras", "Pikachu", "Snorlax", "Charizard", "Squirtle", "Dragonite"], ["Coral-Eye Badge", "Sea Ruby Badge", "Spike Shell Badge", "Jade Star Badge", "Drake Battle"], "Which island mystery should the respondent solve?"),
  },
  {
    title: "Johto Badge and Evolution Log",
    slug: "johto-badge-and-evolution-log",
    description:
      "Track Johto badges, friendship arcs, evolutions and Silver Conference rival moments.",
    pokemonType: "grass",
    visibility: "public",
    themeName: "Johto Evolution Trail",
    coverImageUrl: pokemonImage(152),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("grass", ["Chikorita", "Cyndaquil", "Totodile", "Noctowl", "Heracross", "Bayleef"], ["Zephyr Badge", "Hive Badge", "Storm Badge", "Rising Badge", "Silver Conference"], "Which evolution, friendship or rivalry clue matters most?"),
  },
  {
    title: "Hoenn Contest and Gym Intake",
    slug: "hoenn-contest-and-gym-intake",
    description:
      "Generate forms for Hoenn gym battles, May's contest path and advanced double-battle tactics.",
    pokemonType: "fire",
    visibility: "public",
    themeName: "Hoenn Contest Stage",
    coverImageUrl: pokemonImage(257),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("fire", ["Treecko", "Grovyle", "Swellow", "Corphish", "Torkoal", "Glalie"], ["Stone Badge", "Dynamo Badge", "Mind Badge", "Rain Badge", "Ever Grande Conference"], "Which contest ribbon, battle style or team growth should stand out?"),
  },
  {
    title: "Battle Frontier Strategy Card",
    slug: "battle-frontier-strategy-card",
    description:
      "Build tactical forms around Frontier Brains, facility symbols and champion practice battles.",
    pokemonType: "fighting",
    visibility: "public",
    themeName: "Battle Frontier Circuit",
    coverImageUrl: pokemonImage(448),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("fighting", ["Sceptile", "Donphan", "Aipom", "Swellow", "Pikachu", "Charizard"], ["Battle Factory", "Battle Arena", "Battle Dome", "Battle Palace", "Pyramid King Brandon"], "What strategy turns this facility battle?"),
  },
  {
    title: "Sinnoh Myth and Rivalry Report",
    slug: "sinnoh-myth-and-rivalry-report",
    description:
      "Capture Sinnoh's badges, Paul rivalry, Dawn contest energy and Team Galactic mysteries.",
    pokemonType: "steel",
    visibility: "public",
    themeName: "Sinnoh Mystery Lab",
    coverImageUrl: pokemonImage(483),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("steel", ["Turtwig", "Infernape", "Staraptor", "Buizel", "Gliscor", "Gible"], ["Coal Badge", "Cobble Badge", "Mine Badge", "Beacon Badge", "Lily of the Valley Conference"], "Which myth, evolution or rivalry detail should be investigated?"),
  },
  {
    title: "Unova New Pokemon Discovery",
    slug: "unova-new-pokemon-discovery",
    description:
      "A creator-ready form for fresh Unova Pokemon, Iris and Cilan travel moments and Vertress Conference prep.",
    pokemonType: "water",
    visibility: "public",
    themeName: "Unova Discovery Route",
    coverImageUrl: pokemonImage(501),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("water", ["Oshawott", "Snivy", "Tepig", "Scraggy", "Leavanny", "Krookodile"], ["Trio Badge", "Insect Badge", "Bolt Badge", "Freeze Badge", "Vertress Conference"], "Which new Pokemon discovery should the form reveal?"),
  },
  {
    title: "Kalos Bond Phenomenon Tracker",
    slug: "kalos-bond-phenomenon-tracker",
    description:
      "Create animated Kalos forms for Serena, Clemont, Mega Evolution, Team Flare and Ash-Greninja moments.",
    pokemonType: "dragon",
    visibility: "public",
    themeName: "Kalos Bond Phenomenon",
    coverImageUrl: pokemonImage(658),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("dragon", ["Froakie", "Frogadier", "Greninja", "Talonflame", "Hawlucha", "Noivern"], ["Bug Badge", "Voltage Badge", "Fairy Badge", "Iceberg Badge", "Lumiose Crisis"], "What triggers the bond phenomenon or Mega Evolution clue?"),
  },
  {
    title: "Alola Island Trial Festival",
    slug: "alola-island-trial-festival",
    description:
      "Collect Alola trial stories, Z-move moments, Ultra Beast sightings and Manalo Conference picks.",
    pokemonType: "fire",
    visibility: "public",
    themeName: "Alola Champion Festival",
    coverImageUrl: pokemonImage(727),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("fire", ["Rowlet", "Lycanroc", "Incineroar", "Melmetal", "Naganadel", "Pikachu"], ["Melemele Trial", "Akala Trial", "Ula'ula Trial", "Poni Trial", "Manalo Champion"], "Which Z-move, island bond or Ultra mystery defines this entry?"),
  },
  {
    title: "World Coronation Masters Eight Bracket",
    slug: "world-coronation-masters-eight-bracket",
    description:
      "Generate forms for global rankings, Goh research notes, Lucario aura training and Masters Eight predictions.",
    pokemonType: "fighting",
    visibility: "public",
    themeName: "World Coronation Arena",
    coverImageUrl: pokemonImage(448),
    notificationEmail: "demo@pokebuilder.dev",
    fields: journeyTemplateFields("fighting", ["Pikachu", "Lucario", "Dragonite", "Gengar", "Sirfetch'd", "Dracovish"], ["Normal Class", "Great Class", "Ultra Class", "Masters Eight", "Leon Final"], "Which world-stage battle plan should the creator collect?"),
  },
  {
    title: "Pokemon Evolution Mystery Archive",
    slug: "pokemon-evolution-mystery-archive",
    description:
      "A research-style form for evolution triggers, legendary clues, ruins, fossils and rare power changes.",
    pokemonType: "psychic",
    visibility: "unlisted",
    themeName: "Evolution Mystery Archive",
    coverImageUrl: pokemonImage(150),
    notificationEmail: "research@pokebuilder.dev",
    fields: journeyTemplateFields("psychic", ["Mewtwo", "Mew", "Eevee", "Riolu", "Gible", "Rotom"], ["Lab Scan", "Ancient Ruin", "Evolution Stone", "Aura Bond", "Legendary Signal"], "What is the mystery, clue or evolution theory?"),
  },
  {
    title: "Friends, Rivals and Reunion Wall",
    slug: "friends-rivals-and-reunion-wall",
    description:
      "Build a community wall for companions, rivals, reunion memories and the emotional backbone of Ash's journey.",
    pokemonType: "fairy",
    visibility: "public",
    themeName: "Friends and Rivals Lounge",
    coverImageUrl: pokemonImage(175),
    notificationEmail: "friends@pokebuilder.dev",
    fields: journeyTemplateFields("fairy", ["Misty", "Brock", "May", "Dawn", "Serena", "Goh"], ["First Meeting", "Rival Battle", "Contest Stage", "Farewell", "Reunion"], "Which friendship, rival or farewell moment should be preserved?"),
  },
];

export const samplePokemonForms = [
  {
    title: "Kanto Gym Leader Application",
    slug: "kanto-gym-leader-application",
    description:
      "Recruit elite trainers for a Kanto league circuit with badges, battle styles and Pokemon specialties.",
    pokemonType: "electric" as const,
    visibility: "public" as const,
    themeName: "Pikachu Neon League",
    coverImageUrl: pokemonImage(25),
    notificationEmail: "demo@pokebuilder.dev",
    fields: [
      ...defaultFieldsForType("electric"),
      {
        key: "badge_type",
        type: "multi_select" as const,
        label: "Which badges can you defend?",
        required: true,
        options: ["Thunder", "Cascade", "Boulder", "Soul"].map((value) => ({
          label: `${value} badge`,
          value: slugify(value),
        })),
        validations: {},
        conditionalLogic: [],
      },
    ],
  },
  {
    title: "Starter Pokemon Matchmaker",
    slug: "starter-pokemon-matchmaker",
    description:
      "A playful intake form for matching new trainers with the right first partner.",
    pokemonType: "grass" as const,
    visibility: "public" as const,
    themeName: "Bulbasaur Verdant Lab",
    coverImageUrl: pokemonImage(1),
    notificationEmail: "professor@pokebuilder.dev",
    fields: [
      ...defaultFieldsForType("grass"),
      {
        key: "starter_choice",
        type: "single_select" as const,
        label: "Starter energy",
        required: true,
        options: ["Calm Bulbasaur", "Bold Charmander", "Loyal Squirtle", "Wild Pikachu"].map(
          (value) => ({ label: value, value: slugify(value) }),
        ),
        validations: {},
        conditionalLogic: [],
      },
    ],
  },
  {
    title: "Lavender Town Ghost Survey",
    slug: "lavender-town-ghost-survey",
    description:
      "A cinematic community survey for ghost sightings, strange sounds and midnight arcade theories.",
    pokemonType: "ghost" as const,
    visibility: "unlisted" as const,
    themeName: "Gengar Midnight Arcade",
    coverImageUrl: pokemonImage(94),
    notificationEmail: "ghostlab@pokebuilder.dev",
    fields: defaultFieldsForType("ghost"),
  },
  ...ashJourneyFormTemplates,
];
