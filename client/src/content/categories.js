// client/src/content/categories.js
// Owner: Gagare (Category Guidance, Examples, Safety Dos and Don'ts)

export const categoriesData = [
  {
    id: 'pothole',
    name: 'Potholes',
    icon: '🕳️',
    shortDescription: 'Road surface depressions, craters, and asphalt erosion that endanger commuters and damage vehicles.',
    examples: [
      'Deep asphalt craters and sunken road patches across vehicular lanes',
      'Edge erosion and crumbling shoulder pavement along busy roads',
      'Depressed trench cuts left after underground utility pipe repairs'
    ],
    dos: [
      'Take photos during daylight from a safe roadside vantage point',
      'Note exact nearby landmarks or mile markers for road repair crews',
      'Stay completely off active vehicular traffic lanes while taking photos'
    ],
    donts: [
      'Never walk or stand in the middle of active traffic to photograph damage',
      'Don\'t attempt to measure or touch hazardous crater edges manually',
      'Don\'t block vehicular flow or create traffic delays while reporting'
    ],
    department: 'Road Maintenance Dept',
    authority: 'Roads & Infrastructure',
    severityWeight: 4
  },
  {
    id: 'garbage',
    name: 'Garbage Dump',
    icon: '🗑️',
    shortDescription: 'Overflowing community bins, illegal roadside dumping, and uncollected domestic or commercial waste.',
    examples: [
      'Overflowing municipal waste bins spilling onto sidewalks and roadways',
      'Illegal open dumping accumulations along vacant plots or street curbs',
      'Accumulated commercial or domestic refuse obstructing stormwater gutters'
    ],
    dos: [
      'Include clear surrounding landmarks to help the sanitation van locate the dump',
      'Mention if waste is obstructing drainage channels or pedestrian walkways',
      'Capture photos from an upwind and hygienic distance'
    ],
    donts: [
      'Never touch or rummage through biomedical, chemical, or hazardous waste',
      'Don\'t attempt to burn garbage piles to eliminate waste',
      'Don\'t enter unsafe or unstable heaps of heavy debris'
    ],
    department: 'Sanitation Dept',
    authority: 'Solid Waste Management',
    severityWeight: 3
  },
  {
    id: 'tree',
    name: 'Overgrown Trees',
    icon: '🌳',
    shortDescription: 'Fallen tree trunks, dangerous broken boughs, and heavy branches obstructing roads or endangering utility lines.',
    examples: [
      'Uprooted trees or fallen boughs obstructing public streets or sidewalks',
      'Heavy, fractured, or low-hanging branches posing imminent fall risk',
      'Overgrown branches encroaching upon power cables or blocking traffic signboards'
    ],
    dos: [
      'Alert nearby pedestrians if a branch is visibly cracking or precariously tilted',
      'Report immediately if branches are in direct contact with electrical lines',
      'Capture wide-angle photos showing tree proximity to roads or structures'
    ],
    donts: [
      'Never climb or attempt to prune trees touching or near utility lines yourself',
      'Don\'t park vehicles or stand directly beneath fractured or leaning limbs',
      'Don\'t yank or pull on hanging branches or entangled wires'
    ],
    department: 'Garden & Tree Authority',
    authority: 'Horticulture & Parks',
    severityWeight: 3
  },
  {
    id: 'cable',
    name: 'Hanging Cables',
    icon: '⚡',
    shortDescription: 'Dangling, snapped, sparking, or low-hanging electric wires and damaged utility poles posing electrocution hazards.',
    examples: [
      'Dangling or severed power cables lying on or near public footpaths',
      'Low-sagging transmission wires within reach of pedestrians or vehicles',
      'Snapped wires sparking or touching puddles, metal fences, or poles'
    ],
    dos: [
      'Stay at least 10 meters (33 feet) away and actively warn others nearby',
      'Take your photo from a safe distance using camera zoom if available',
      'Notify emergency services immediately if sparking or imminent risk is observed'
    ],
    donts: [
      'NEVER touch any dangling wire, utility pole, or nearby puddle',
      'Don\'t stand under or walk near dangling cables during rain or storms',
      'Don\'t attempt to lift, move, or drive vehicles over fallen wires'
    ],
    department: 'Power Supply & Streetlights',
    authority: 'Electrical & Lighting',
    severityWeight: 5
  },
  {
    id: 'animal',
    name: 'Dead Animals',
    icon: '🐕',
    shortDescription: 'Carcasses of stray, domestic, or wild animals on public roads requiring urgent, hygienic removal.',
    examples: [
      'Deceased stray animals on roadways, sidewalks, or median dividers',
      'Animal carcasses in public parks, playgrounds, or water catchment channels',
      'Deceased birds or rodents creating biological and public health hazards'
    ],
    dos: [
      'Provide precise location details and landmark references for the sanitary crew',
      'Capture photo evidence from a safe, hygienic distance',
      'Keep children and domestic pets safely away from the carcass'
    ],
    donts: [
      'Never touch, inspect, or attempt to move the animal carcass yourself',
      'Don\'t allow domestic pets to sniff or approach the deceased animal',
      'Don\'t spray chemicals or dispose of carcasses into public drains or dumpsters'
    ],
    department: 'Public Health Dept',
    authority: 'Animal Welfare & Control',
    severityWeight: 4
  },
  {
    id: 'other',
    name: 'Other Issues',
    icon: '📌',
    shortDescription: 'Damaged footpaths, missing manhole covers, malfunctioning streetlights, and general civic infrastructure defects.',
    examples: [
      'Missing, dislodged, or broken manhole and storm drain chamber covers',
      'Shattered sidewalk tiles, damaged curbstones, and missing safety barriers',
      'Non-functioning streetlights, exposed utility junction boxes, or open trenches'
    ],
    dos: [
      'Describe the issue clearly, mentioning any immediate public safety hazard',
      'Place a visible temporary marker or warning object near open manholes if safe',
      'Take clear photos showing both the defect and its surrounding context'
    ],
    donts: [
      'Never step near or look down into unbarricaded open manholes or deep trenches',
      'Don\'t tamper with open electrical junction boxes or municipal equipment',
      'Don\'t attempt unauthorized structural repairs on public infrastructure'
    ],
    department: 'Civic Administration',
    authority: 'General Municipal Cell',
    severityWeight: 2
  }
];

export const categoriesMap = categoriesData.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {});

export default categoriesData;
