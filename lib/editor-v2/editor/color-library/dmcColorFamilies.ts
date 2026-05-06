import type { PaletteColor } from "../store/state";

export const DMC_COLOR_FAMILY_ORDER = [
  "red",
  "pink",
  "purple",
  "blue",
  "green",
  "yellow",
  "orange",
  "brown",
  "beige",
  "grey",
  "white",
  "black",
] as const;

export type DmcColorFamily = (typeof DMC_COLOR_FAMILY_ORDER)[number];

export type DmcColorFamilySection = {
  family: DmcColorFamily | "other";
  label: string;
  colors: PaletteColor[];
};

const DMC_COLOR_FAMILY_CODES: Record<DmcColorFamily, readonly string[]> = {
  red: [
    "107", "115", "21", "22", "221", "304", "321", "326",
    "3328", "3340", "347", "349", "350", "351", "3685", 
    "3831", "498", "777", "814",
    "815", "816", "817", "902", "99", "3830",
  ],
  pink: [
    "223", "224", "225", "23", "3326", "335", "3354", "353", "3689", "3706",
    "3708", "3712", "3713", "3716", "3731", "3733", "3824", "3833", "48", "602",
    "603", "604", "760", "761", "778", "818", "894", "899", "956", "957",
    "961", "962", "963", "967", "666","352","3804", "3805","3806", "892","151",
    "152","601", "3721", "605", "3778", "3779", "893", "891", "309", "3705",
    "3801", "600", "3832","150", "3350", "3607", "3608", "3609", "3803",
    "819", 
  ],
  purple: [
    "153", "154", "155", "156", "208", "209", "210", "211", "24", "25",
    "26", "30", "3041", "3042", "31", "315", "316", "32", "327", "33",
    "333", "34", "340", "35", "3687", "3688", "3722",
    "3726", "3727", "3740", "3743", "3802", "3834",
    "3835", "3836", "3837", "52", "550", "552", "553", "554", "718", "915",
    "917","3746","341", "3747",
  ],
  blue: [
    "121", "157", "158", "159", "160", "161", "162", "28", "311", "312",
    "322", "3325", "334", "336", "3750", "3752", "3753", "3755", "3760", "3761",
    "3765", "3766", "3768", "3807", "3808", "3809", "3810", "3811", "3838",
    "3839", "3841", "3843", "3844", "3845", "3846", "517", "518", "519",
    "597", "598", "747", "775", "791", "792", "793", "794", "796", "797",
    "798", "799", "800", "809", "813", "820", "824", "826", "827", "93",
    "930", "932", "995", "996", "806", "825", "803", "807", "3842", "3756", "828",
    "931", "3840", 
  ],
  green: [
    "125", "13", "15", "16", "163", "3011", "3012", "3013", "3051", "319",
    "320", "3345", "3346", "3347", "3348", "3362", "3363", "3364", "367", "368",
    "369", "3781", "3787", "3812", "3813", "3814", "3815", "3817", "3818", "3847",
    "3848", "3849", "3851", "469", "470", "471", "501", "502", "503", "505",
    "520", "522", "524", "561", "562", "563", "580", "581", "640", "642",
    "645", "646", "699", "700", "701", "702", "703", "704", "730", "732",
    "733", "734", "772", "890", "895", "904", "905", "906", "907", "909",
    "910", "911", "912", "913", "92", "924", "926", "927", "928", "934",
    "935", "936", "937", "94", "954", "955", "958", "3819", "166", "472","731",
    "959", "504", "966", "986", "987", "988", "989", "992", "993", "991", "992",
    "993", "3816", "164", "564", "943", "3850", "3052", "3053", "523", "964", 
    "500", "3799", 
  ],
  yellow: [
    "10", "11", "111", "165", "307", "3078", "3820", "3821",
    "3822", "3823", "444", "727", "728", "90", "973", "743", "744", "745",
    "726","445",
  ],
  orange: [
    "106", "19", "20", "3341",  "3776", "3825", "3827", "3852", "3853",
    "3854", "3855", "3856", "402", "51", "676", "721", "722", "725", "740",
    "741", "742", "783", "922", "972", "976",
    "977", "781", "971", "606", "608", "720", "900", "946","947", "918", "919", "920",
    "921", "970",
  ],
  brown: [
    "8", "105", "167", "300", "301", "3032", "3033", "3045", "3046", "3064",
    "355", "356", "370", "371", "372", "3771", "3772", "3777", "3790", "3826",
    "3828", "3829", "3857", "3858", "3859", "3860", "3862", "3864", "407", "420",
    "422", "433", "434", "435", "436", "437", "543", "610", "611", "612",
    "632", "677", "680", "69", "729", "738", "739", "754", "758", "780",
    "782", "801", "829", "831", "832", "833", "834", "838", "839", "840",
    "842", "869", "898", "938", "945", "948", "950", "951", "975", "3773",
    "779", "830", "841", "3863", "400", "3782", "613", "3047", "3774", 
  ],
  beige: ["5", "6", "7", "822"],
  grey: [
    "1", "2", "4", "168", "169", "27", "317", "318", "3861",
    "413", "414", "415", "451", "452", "453", "53", "535", "644", "648"
    ,"3023", "3", "3022", "3072", "647", "3024", 
  ],
  white: ["3770", "3865", "3866", "712", "746", "762", "B5200", "BLANC", "ECRU"],
  black: ["3021", "3031", "310", "3371", "823", "844", "939"],
};

const DMC_COLOR_FAMILY_LABELS: Record<DmcColorFamily, string> = {
  red: "Red",
  pink: "Pink",
  purple: "Purple",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
  orange: "Orange",
  brown: "Brown",
  beige: "Beige",
  grey: "Grey",
  white: "White",
  black: "Black",
};

const DMC_COLOR_FAMILY_BY_CODE = Object.entries(DMC_COLOR_FAMILY_CODES).reduce<
  Record<string, DmcColorFamily>
>((accumulator, [family, codes]) => {
  for (const code of codes) {
    accumulator[code] = family as DmcColorFamily;
  }

  return accumulator;
}, {});

export function getDmcColorFamily(color: PaletteColor): DmcColorFamily | "other" {
  if (color.brand !== "dmc") {
    return "other";
  }

  return DMC_COLOR_FAMILY_BY_CODE[color.code.toUpperCase()] ?? "other";
}

export function getDmcColorFamilySections(colors: PaletteColor[]): DmcColorFamilySection[] {
  const colorsByFamily = new Map<DmcColorFamily | "other", PaletteColor[]>();

  for (const color of colors) {
    const family = getDmcColorFamily(color);
    const existing = colorsByFamily.get(family);

    if (existing) {
      existing.push(color);
      continue;
    }

    colorsByFamily.set(family, [color]);
  }

  const sections: DmcColorFamilySection[] = [];

  for (const family of DMC_COLOR_FAMILY_ORDER) {
    const familyColors = colorsByFamily.get(family);

    if (!familyColors || familyColors.length === 0) {
      continue;
    }

    sections.push({
      family,
      label: DMC_COLOR_FAMILY_LABELS[family],
      colors: familyColors,
    });
  }

  const otherColors = colorsByFamily.get("other");
  if (otherColors && otherColors.length > 0) {
    sections.push({
      family: "other",
      label: "Other",
      colors: otherColors,
    });
  }

  return sections;
}
