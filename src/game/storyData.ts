import type {
  ComponentId,
  DialogueLine,
  InventoryItem,
  MachineId,
  MachineProfile,
  RepairSystemSlot,
} from './types';

export const ASSETS = {
  jackPortrait:
    '/assets/aistudio/LGbobUvuEVCG_Ajy4MCp_0DFbnlFxm5f-OzmWnce_zvLjSVofJkyP6_Wai0rPuFP9u-hvnSzFSQ9n-BeslsFhkmTljvN4bn-PxyNfuXXm8Lwpq86Ma1ZukbmI0vFzpWrceb_leZNIe9aayS0Phh-0gVBQU00QqToitr12J1ffuOxQzZNsheRQQtxjDSZh-OV_ce05f1be.jpg',
  cockpit: '/assets/aistudio/Retro_Pixel-Art_Spaceship_Cockpit_42433dec.png',
  titleSplitArt: '/assets/aistudio/Pixel_NASA_Missions__Mars_and_Moon-1_edd6ec06.png',
  marsLandscape: '/assets/aistudio/Gemini_Generated_Image_mr5su4mr5su4mr5s_17d0389d.jpg',
  moonRoverArt: '/assets/aistudio/Pixel_Moon_Rover_Adventure_ceed64ad.png',
  moonScene: '/assets/aistudio/__________2026-11-14_204928_00ff5af2.png',
  marsScene: '/assets/aistudio/__________2026-11-14_205027_fca8e187.png',
  eaglePortrait: '/assets/aistudio/__________2026-11-14_112429_56bb2a85.png',
  lrvPortrait: '/assets/aistudio/__________2026-11-14_112423_0f10f6e4.png',
  alsepPortrait: '/assets/aistudio/__________2026-11-14_112418_b37d3ced.png',
  surveyorPortrait: '/assets/aistudio/__________2026-11-14_112244_09372b98.png',
  apolloCommsPortrait: '/assets/aistudio/__________2026-11-14_112248_416779ea.png',
  sojournerPortrait: '/assets/aistudio/__________2026-11-14_133519_ca19fa23.png',
  spiritPortrait: '/assets/aistudio/__________2026-11-14_112438_8a16fbe1.png',
  opportunityPortrait: '/assets/aistudio/__________2026-11-14_124012_3ac3d26d.png',
};

export const MACHINE_PROFILES: Record<MachineId, MachineProfile> = {
  eagle: {
    id: 'eagle',
    name: 'Eagle',
    fullName: 'Apollo 11 Lunar Module "Eagle"',
    location: 'Moon',
    era: 'July 1969',
    personality: 'Calm, warm, wise, slightly nostalgic, protective',
    voicePitch: 240,
    portraitSrc: ASSETS.eaglePortrait,
    nasaSummary:
      'Apollo 11 landed in the Sea of Tranquility in July 1969. Neil Armstrong and Buzz Aldrin used Eagle to descend to the lunar surface.',
    nasaFacts: [
      'Consisted of two parts: the Descent Stage (four landing legs, gold thermal foil) and the Ascent Stage.',
      'The Descent Stage remained on the Moon while the Ascent Stage carried Armstrong and Aldrin back to lunar orbit.',
      'Enabled humanity’s first steps on the Moon on July 20, 1969.',
    ],
    nasaReferenceUrl: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C',
    storyRole:
      'First machine Jack wakes on the Moon. Reveals the secret of other forgotten machines and guides Jack’s supply mission.',
  },
  lrv: {
    id: 'lrv',
    name: 'LRV',
    fullName: 'Lunar Roving Vehicle (Moon Buggy)',
    location: 'Moon',
    era: '1971–1972 (Apollo 15, 16, 17)',
    personality: 'Friendly, energetic, adventurous, excited to explore',
    voicePitch: 360,
    portraitSrc: ASSETS.lrvPortrait,
    nasaSummary:
      'A four-wheeled electric battery-powered rover used on Apollo 15, 16, and 17 to expand how far astronauts could travel on the Moon.',
    nasaFacts: [
      'Powered by two 36-volt silver-zinc batteries driving electric motors in each wheel hub.',
      'Used wire-mesh wheels with titanium chevrons to grip powdery lunar regolith without flat tires.',
      'Allowed Apollo 17 astronauts to explore miles away from their lander.',
    ],
    nasaReferenceUrl: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
    storyRole:
      'Guides Jack across rough lunar craters and helps recover lunar samples and the Traction & Motor Module.',
  },
  alsep: {
    id: 'alsep',
    name: 'ALSEP',
    fullName: 'Apollo Lunar Surface Experiments Package',
    location: 'Moon',
    era: '1969–1977 (Apollo 12, 14, 15, 16, 17)',
    personality: 'Intelligent, analytical, patient, scientific',
    voicePitch: 280,
    portraitSrc: ASSETS.alsepPortrait,
    nasaSummary:
      'A suite of scientific instruments deployed by Apollo astronauts that studied the Moon’s interior and environment long after crews returned to Earth.',
    nasaFacts: [
      'Included seismometers (moonquakes), magnetometers (magnetic fields), heat-flow probes, and particle detectors.',
      'Powered by radioisotope thermoelectric generators (RTGs) for multi-year science.',
      'Transmitted lunar data back to Earth until September 30, 1977.',
    ],
    nasaReferenceUrl: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C',
    storyRole:
      'Coordinates the scientific instrument cluster inside the ancient crater and supplies diagnostic sensor hardware.',
  },
  surveyor: {
    id: 'surveyor',
    name: 'Surveyor',
    fullName: 'Surveyor Robotic Lunar Lander',
    location: 'Moon',
    era: '1966–1968',
    personality: 'Brave, curious, proud early lunar pioneer',
    voicePitch: 330,
    portraitSrc: ASSETS.surveyorPortrait,
    nasaSummary:
      'Early three-legged robotic landers sent to prove soft landing on the Moon was possible and test lunar soil before Apollo.',
    nasaFacts: [
      'Surveyor 1 achieved the first American soft landing on the Moon in June 1966.',
      'Carried television cameras and soil-mechanics samplers to verify the ground would support Apollo landers.',
      'Surveyor 3 was later visited in person by the Apollo 12 astronauts in 1969.',
    ],
    nasaReferenceUrl: 'https://science.nasa.gov/mission/surveyor-3/',
    storyRole:
      'Shares landing calibration telemetry and structural components to stabilize Jack’s ship.',
  },
  apollo_comms: {
    id: 'apollo_comms',
    name: 'Apollo Comms',
    fullName: 'Apollo Lunar Communication Relay',
    location: 'Moon',
    era: '1969–1972',
    personality: 'Helpful, reliable, responsible',
    voicePitch: 310,
    portraitSrc: ASSETS.apolloCommsPortrait,
    nasaSummary:
      'High-gain parabolic antenna and radio systems that carried astronaut voices, telemetry, and live television across 384,000 km to Earth.',
    nasaFacts: [
      'Used S-band radio frequencies to maintain clear links with NASA’s Deep Space Network.',
      'Allowed Mission Control to monitor spacecraft health and guide astronauts in real time.',
    ],
    nasaReferenceUrl: 'https://nssdc.gsfc.nasa.gov/',
    storyRole:
      'Provides the Deep-Space Communication Relay so Jack can re-establish long-range signals.',
  },
  sojourner: {
    id: 'sojourner',
    name: 'Sojourner',
    fullName: 'Mars Pathfinder Rover "Sojourner"',
    location: 'Mars',
    era: 'July–September 1997',
    personality: 'Cheerful, curious, playful, small but courageous',
    voicePitch: 480,
    portraitSrc: ASSETS.sojournerPortrait,
    nasaSummary:
      'The first wheeled rover to operate successfully on Mars, landing in Ares Vallis on July 4, 1997 with Mars Pathfinder.',
    nasaFacts: [
      'Weighed only ~10.6 kilograms (about 23 pounds) and rolled on six rocker-bogie wheels.',
      'Sent back more than 550 rover images and over 15 chemical analyses of Martian rocks and soil.',
      'Last communicated with Earth in September 1997 after exceeding its 7-day baseline mission.',
    ],
    nasaReferenceUrl: 'https://science.nasa.gov/mission/mars-pathfinder/',
    storyRole:
      'The first Martian rover Jack awakens by cleaning solar dust, eager to guide him to Spirit and Opportunity.',
  },
  spirit: {
    id: 'spirit',
    name: 'Spirit',
    fullName: 'Mars Exploration Rover "Spirit" (MER-A)',
    location: 'Mars',
    era: '2004–2010',
    personality: 'Determined, brave, thoughtful, resilient',
    voicePitch: 260,
    portraitSrc: ASSETS.spiritPortrait,
    nasaSummary:
      'Landed in Gusev Crater on January 4, 2004. Designed for 90 Martian days (sols), Spirit worked for over six years and drove ~7.73 km.',
    nasaFacts: [
      'Searched rocks and soil for clues of ancient water on Mars.',
      'Became trapped in soft Martian soil in 2009 while continuing stationary science.',
      'Last confirmed communication was March 22, 2010; NASA ended recovery efforts in May 2011.',
    ],
    nasaReferenceUrl:
      'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    storyRole:
      'Rescued from dust silence; shares geological patience and Martian route wisdom.',
  },
  opportunity: {
    id: 'opportunity',
    name: 'Opportunity',
    fullName: 'Mars Exploration Rover "Opportunity" (MER-B)',
    location: 'Mars',
    era: '2004–2019',
    personality: 'Optimistic, persistent, experienced, hopeful',
    voicePitch: 300,
    portraitSrc: ASSETS.opportunityPortrait,
    nasaSummary:
      'Spirit’s twin, landing in Meridiani Planum on January 25, 2004. Explored for nearly 15 years and drove ~45 kilometers.',
    nasaFacts: [
      'Found compelling mineral evidence that liquid water once flowed on ancient Mars.',
      'Survived decades of Martian winters until a planet-wide dust storm in June 2018 blocked sunlight.',
      'NASA officially declared her mission complete on February 13, 2019.',
    ],
    nasaReferenceUrl:
      'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    storyRole:
      'The final Martian companion awakened, completing the reunion and empowering the Day 123 journey home.',
  },
};

export const COMPONENT_CATALOG: Record<ComponentId, InventoryItem> = {
  universal_power_coupler: {
    id: 'universal_power_coupler',
    name: 'Universal Power Coupler',
    description:
      'Connects damaged power buses and restores primary electrical flow across the ship.',
    category: 'component',
    acquiredOnDay: 28,
    sourceMachine: 'Eagle (Apollo 11)',
    targetSystem: 'electrical_power',
  },
  lunar_traction_module: {
    id: 'lunar_traction_module',
    name: 'Lunar Traction & Motor Module',
    description:
      'High-torque actuator and gyro-stabilizer assembly salvaged from LRV spares.',
    category: 'component',
    acquiredOnDay: 41,
    sourceMachine: 'Lunar Roving Vehicle',
    targetSystem: 'mechanical_systems',
  },
  diagnostic_sensor_pack: {
    id: 'diagnostic_sensor_pack',
    name: 'Diagnostic Sensor Pack',
    description:
      'Calibrated ALSEP/Surveyor telemetry sensors that restore flight stabilization & diagnostics.',
    category: 'component',
    acquiredOnDay: 58,
    sourceMachine: 'ALSEP & Surveyor',
    targetSystem: 'stabilization',
  },
  deep_space_comms_relay: {
    id: 'deep_space_comms_relay',
    name: 'Deep-Space Communication Relay',
    description:
      'S-band transceiver and high-gain antenna assembly from Apollo Comms.',
    category: 'component',
    acquiredOnDay: 60,
    sourceMachine: 'Apollo Communication System',
    targetSystem: 'communication',
  },
  solar_charging_controller: {
    id: 'solar_charging_controller',
    name: 'High-Efficiency Solar Charging Controller',
    description:
      'Regulates solar-to-battery thrust power reserves needed for deep-space escape.',
    category: 'component',
    acquiredOnDay: 96,
    sourceMachine: 'Martian Solar Array',
    targetSystem: 'propulsion_support',
  },
  deep_space_nav_beacon: {
    id: 'deep_space_nav_beacon',
    name: 'Deep-Space Navigation Beacon',
    description:
      'Star-locked return guidance transponder provided by Sojourner, Spirit, and Opportunity.',
    category: 'component',
    acquiredOnDay: 112,
    sourceMachine: 'Sojourner, Spirit & Opportunity',
    targetSystem: 'navigation',
  },
};

export const INITIAL_REPAIR_SYSTEMS: RepairSystemSlot[] = [
  {
    id: 'electrical_power',
    label: 'Electrical Power',
    status: 'damaged',
    requiredComponents: ['universal_power_coupler'],
    installedComponents: [],
    description: 'Core battery bus, cabin lighting, and life-support power.',
  },
  {
    id: 'stabilization',
    label: 'Stabilization',
    status: 'damaged',
    requiredComponents: ['diagnostic_sensor_pack'],
    installedComponents: [],
    description: 'Attitude thrusters, landing struts, and inertial dampening.',
  },
  {
    id: 'mechanical_systems',
    label: 'Mechanical Systems',
    status: 'damaged',
    requiredComponents: ['lunar_traction_module'],
    installedComponents: [],
    description: 'Fuel valves, hatch actuators, and structural linkages.',
  },
  {
    id: 'communication',
    label: 'Communication',
    status: 'damaged',
    requiredComponents: ['deep_space_comms_relay'],
    installedComponents: [],
    description: 'Long-range telemetry dish and Earth voice link.',
  },
  {
    id: 'propulsion_support',
    label: 'Propulsion Support',
    status: 'damaged',
    requiredComponents: ['solar_charging_controller'],
    installedComponents: [],
    description: 'High-voltage thruster ignition and deep-space energy buffer.',
  },
  {
    id: 'navigation',
    label: 'Navigation',
    status: 'damaged',
    requiredComponents: ['deep_space_nav_beacon'],
    installedComponents: [],
    description: 'Interplanetary trajectory computer and Earth return lock.',
  },
];

export const STORY_DIALOGUES: Record<string, DialogueLine[]> = {
  intro_after_landing: [
    {
      speaker: 'SHIP COMPUTER',
      speakerId: 'computer',
      text: 'EMERGENCY LANDING SUCCESSFUL. MISSION STATUS: STRANDED ON THE MOON (DAY 23 OF 90).',
      mood: 'urgent',
    },
    {
      speaker: 'SHIP COMPUTER',
      speakerId: 'computer',
      text: 'EXTERNAL RESCUE ESTIMATE: APPROXIMATELY 10 YEARS. ALL PRIMARY SYSTEMS DAMAGED.',
      mood: 'urgent',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'Ten years... Nobody is going to reach me in time. I have to find a way to fix this ship myself.',
      mood: 'worried',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'Let’s step outside and inspect the lunar terrain. Maybe something out there can help.',
      mood: 'calm',
    },
  ],
  ch1_eagle_first_meet: [
    {
      speaker: 'NARRATOR',
      speakerId: 'narrator',
      text: 'Jack sits alone beside a cold gray boulder, listening to his breathing inside his helmet. Suddenly, fine lunar dust stirs beneath his boots...',
      mood: 'nostalgic',
    },
    {
      speaker: 'NARRATOR',
      speakerId: 'narrator',
      text: 'A large structure wrapped in gold thermal foil emerges from the silver dust, resting on four metallic legs.',
      mood: 'calm',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'Whoa... what is this thing? Wait—is this an old Apollo lander? ...What’s up, piece of crap?',
      mood: 'happy',
    },
    {
      speaker: 'NARRATOR',
      speakerId: 'narrator',
      text: 'Jack gives one landing leg a playful tap with his boot. To his shock, a gentle blue indicator light flickers alive!',
      mood: 'happy',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'Hellooooooooo... Can you move me away from here?',
      mood: 'nostalgic',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'WHOA! You can talk?! Who are you?!',
      mood: 'urgent',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'My name is the Apollo Lunar Module, though the humans who flew me called me Eagle.',
      mood: 'calm',
      factTag: 'NASA History: Apollo 11 Lunar Module "Eagle" (July 1969)',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'I was built in two sections: my upper Ascent Stage carried astronauts Neil Armstrong and Buzz Aldrin back to lunar orbit in July 1969.',
      mood: 'calm',
      factTag: 'Real Fact: The Ascent Stage returned to orbit; the Descent Stage remained in the Sea of Tranquility.',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'My lower Descent Stage—the gold legs and base you see now—stayed behind on the Moon. For decades, I have waited in the quiet dark.',
      mood: 'nostalgic',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'Listen closely, Jack... I have a big secret to tell you. I am not the only one left behind.',
      mood: 'calm',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'Other robotic explorers remain across the Moon—and even farther away on Mars. If we work together, my spare hardware can help repair your spacecraft.',
      mood: 'happy',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'First, scatter-dropped emergency supplies nearby can keep you alive and jump-start repairs. Collect 3 Oxygen Tanks, 3 Energy Cells, and 4 Repair Parts—watch out for falling meteors!',
      mood: 'urgent',
    },
  ],
  ch2_eagle_reward: [
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'You made it back safely, Jack! Look inside my lower equipment bay—I kept one Universal Power Coupler intact.',
      mood: 'happy',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'A Universal Power Coupler! That will reconnect my main electrical bus! Thank you, Eagle!',
      mood: 'happy',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'Head back to your damaged spacecraft and install it in the Electrical Power slot. Then we will travel east to find an old friend on wheels.',
      mood: 'calm',
    },
  ],
  ch3_lrv_meet: [
    {
      speaker: 'NARRATOR',
      speakerId: 'narrator',
      text: 'Further across the silver hills, Jack and Eagle spot a metallic reflection—four wire-mesh wheels poking out of the lunar soil.',
      mood: 'calm',
    },
    {
      speaker: 'LRV',
      speakerId: 'lrv',
      text: 'Bzzzt—whirr! Hey, Eagle! And a real astronaut! Welcome aboard!',
      mood: 'happy',
    },
    {
      speaker: 'LRV',
      speakerId: 'lrv',
      text: 'I am the Lunar Roving Vehicle—or Moon Buggy! I was a four-wheeled electric vehicle powered by batteries during Apollo 15, Apollo 16, and Apollo 17.',
      mood: 'happy',
      factTag: 'NASA History: LRVs drove across the Moon on Apollo 15, 16 & 17 (1971–1972).',
    },
    {
      speaker: 'LRV',
      speakerId: 'lrv',
      text: 'Astronauts drove me across valleys, boulders, and craters so they could gather rock samples far from their landers!',
      mood: 'calm',
    },
    {
      speaker: 'LRV',
      speakerId: 'lrv',
      text: 'I know where the hidden lunar machines are resting in the Ancient Crater, but my drive system needs a field run. Drive me across the ridge, collect 3 Lunar Samples, and reach the beacon!',
      mood: 'brave',
    },
  ],
  ch3_lrv_reward: [
    {
      speaker: 'LRV',
      speakerId: 'lrv',
      text: 'WOOHOO! Three lunar samples secured and my drive motors are humming again!',
      mood: 'happy',
    },
    {
      speaker: 'LRV',
      speakerId: 'lrv',
      text: 'Take this Lunar Traction & Motor Module for your ship’s Mechanical Systems—and I have mapped the path to the Ancient Crater!',
      mood: 'calm',
    },
  ],
  ch4_crater_machines: [
    {
      speaker: 'NARRATOR',
      speakerId: 'narrator',
      text: 'Jack, Eagle, and the LRV arrive at a vast ancient crater. As their beacons pulse, silver dust lifts and four more historical systems glow to life!',
      mood: 'happy',
    },
    {
      speaker: 'ALSEP',
      speakerId: 'alsep',
      text: 'Greetings, traveler. I am ALSEP—the Apollo Lunar Surface Experiments Package. Deployed by Apollo 12, 14, 15, 16, and 17 crews, my instruments studied moonquakes, magnetic fields, and lunar heat flow.',
      mood: 'calm',
      factTag: 'NASA History: ALSEP transmitted lunar science back to Earth until September 30, 1977.',
    },
    {
      speaker: 'ALSEP',
      speakerId: 'alsep',
      text: 'Even after astronauts went home, our seismometers, magnetometers, and heat-flow probes kept sending data back to Earth until September 30, 1977.',
      mood: 'nostalgic',
    },
    {
      speaker: 'SURVEYOR',
      speakerId: 'surveyor',
      text: 'And don’t forget me! I’m Surveyor! Starting with Surveyor 1’s soft landing in 1966, my three-legged robotic family tested the Moon’s surface so Apollo crews could land safely.',
      mood: 'happy',
      factTag: 'NASA History: Surveyor 1 achieved the first US soft lunar landing in 1966.',
    },
    {
      speaker: 'APOLLO COMMS',
      speakerId: 'apollo_comms',
      text: 'Kshhh—loud and clear! I’m the Apollo Communication System. My dish carried astronaut voices, spacecraft telemetry, and live images across space to Mission Control.',
      mood: 'calm',
    },
    {
      speaker: 'ALSEP',
      speakerId: 'alsep',
      text: 'Our instrument labels and patch cables were scrambled over the decades. Match each scientific device with its true function so we can calibrate our Diagnostic Sensor Pack and Communication Relay for your ship!',
      mood: 'urgent',
    },
  ],
  ch4_crater_reward: [
    {
      speaker: 'APOLLO COMMS',
      speakerId: 'apollo_comms',
      text: 'Every instrument calibrated! Signal lock is crystal clear!',
      mood: 'happy',
    },
    {
      speaker: 'SURVEYOR',
      speakerId: 'surveyor',
      text: 'Here are the Diagnostic Sensor Pack and the Deep-Space Communication Relay—plus spare wires and plating. Return to your spacecraft and install them!',
      mood: 'happy',
    },
  ],
  ch5_mars_reveal: [
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'Look at that—Power, Stabilization, Mechanical, and Communication systems are humming! The ship is finally flight-capable!',
      mood: 'happy',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'I can finally go home to Earth... warm sunlight, blue skies, fresh air...',
      mood: 'calm',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'Jack... before you launch... there is something we must ask.',
      mood: 'nostalgic',
    },
    {
      speaker: 'APOLLO COMMS',
      speakerId: 'apollo_comms',
      text: 'With our dish online, I picked up faint echoes from Mars. Three robotic rovers—Sojourner, Spirit, and Opportunity—are buried under red dust and silent.',
      mood: 'worried',
    },
    {
      speaker: 'LRV',
      speakerId: 'lrv',
      text: 'Their solar panels are choked with Martian dust. Their batteries are freezing in the dark. We know you just want to get home... it’s your choice.',
      mood: 'nostalgic',
    },
  ],
  ch6_mars_arrival: [
    {
      speaker: 'NARRATOR',
      speakerId: 'narrator',
      text: 'After a daring flight across deep space, Jack and Eagle touch down on the rust-red plains of Mars beneath a butterscotch sky.',
      mood: 'brave',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'Look at those red dunes... and over there by the rocky floodplain—I see a tiny six-wheeled rover buried in dust!',
      mood: 'worried',
    },
    {
      speaker: 'EAGLE',
      speakerId: 'eagle',
      text: 'Her solar array is completely coated in Martian dust. If we clean at least 90% of the solar cells before the wind shifts, sunlight can wake her systems!',
      mood: 'urgent',
    },
  ],
  ch6_sojourner_meet: [
    {
      speaker: 'SOJOURNER',
      speakerId: 'sojourner',
      text: 'Beep-beep-boop! Sunlight!! Oh! Hello!! Are you from Earth?!',
      mood: 'happy',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'Hey little guy! Welcome back! I’m Jack—and this is Eagle from Apollo 11.',
      mood: 'happy',
    },
    {
      speaker: 'SOJOURNER',
      speakerId: 'sojourner',
      text: 'I’m Sojourner! I landed in Ares Vallis on July 4, 1997 with Mars Pathfinder! I only weighed about 10.6 kilograms, and I proved tiny rovers could drive and test rocks on another planet!',
      mood: 'happy',
      factTag: 'NASA History: Sojourner (Mars Pathfinder) landed July 4, 1997; sent 550+ images & 15+ rock analyses before losing contact in Sept 1997.',
    },
    {
      speaker: 'SOJOURNER',
      speakerId: 'sojourner',
      text: 'I sent over 550 pictures before losing contact in September 1997. Thank you for wiping my panels! Take this Solar Charging Controller for your engines—and let’s go wake Spirit and Opportunity!',
      mood: 'brave',
    },
  ],
  ch7_spirit_meet: [
    {
      speaker: 'SPIRIT',
      speakerId: 'spirit',
      text: 'Whirr... optical mast online. Is someone really out here in Gusev Crater?',
      mood: 'nostalgic',
    },
    {
      speaker: 'SOJOURNER',
      speakerId: 'sojourner',
      text: 'Spirit! We found you!',
      mood: 'happy',
    },
    {
      speaker: 'SPIRIT',
      speakerId: 'spirit',
      text: 'I’m Spirit. I landed on Mars on January 4, 2004. NASA planned a 90-day mission, yet I kept exploring for over six years—traveling 7.73 kilometers looking for signs of past water.',
      mood: 'calm',
      factTag: 'NASA History: Spirit landed Jan 4, 2004; last contact March 22, 2010; recovery ended May 2011.',
    },
    {
      speaker: 'SPIRIT',
      speakerId: 'spirit',
      text: 'In 2009 my wheels got trapped in soft sand. My last confirmed signal home was March 22, 2010... It feels good not to be forgotten. Let’s go find my twin sister, Opportunity!',
      mood: 'nostalgic',
    },
  ],
  ch7_opportunity_meet: [
    {
      speaker: 'OPPORTUNITY',
      speakerId: 'opportunity',
      text: '...Signal detected. My solar wings are charging again. Spirit? Jack?',
      mood: 'happy',
    },
    {
      speaker: 'SPIRIT',
      speakerId: 'spirit',
      text: 'Oppy! You made it!',
      mood: 'happy',
    },
    {
      speaker: 'OPPORTUNITY',
      speakerId: 'opportunity',
      text: 'I landed in Meridiani Planum on January 25, 2004. Like Spirit, I was built for 90 Martian days—but I explored for nearly 15 years and drove 45 kilometers!',
      mood: 'calm',
      factTag: 'NASA History: Opportunity (2004–2019) drove ~45 km; mission declared complete Feb 13, 2019 after 2018 global dust storm.',
    },
    {
      speaker: 'OPPORTUNITY',
      speakerId: 'opportunity',
      text: 'I found clear evidence that liquid water once shaped Mars. Then the giant global dust storm of 2018 blocked the Sun, and NASA ended my mission on February 13, 2019.',
      mood: 'nostalgic',
    },
    {
      speaker: 'OPPORTUNITY',
      speakerId: 'opportunity',
      text: 'Before we prepare your return home, help us record three final scientific discoveries across this valley—an ancient rock, evidence of ancient water, and one last abandoned exploration beacon!',
      mood: 'brave',
    },
  ],
  ch7_mars_reward: [
    {
      speaker: 'OPPORTUNITY',
      speakerId: 'opportunity',
      text: 'All three Martian discoveries logged! And look—combined with our telemetry, here is the Deep-Space Navigation Beacon for your spacecraft.',
      mood: 'happy',
    },
    {
      speaker: 'JACK',
      speakerId: 'jack',
      text: 'With the Solar Charging Controller and Navigation Beacon installed, all six ship systems will be 100% online. We’re going home!',
      mood: 'happy',
    },
  ],
};

export interface EquipmentPair {
  id: string;
  instrument: string;
  functionText: string;
  iconKey: string;
}

export const EQUIPMENT_MATCH_PAIRS: EquipmentPair[] = [
  {
    id: 'seismometer',
    instrument: 'Seismometer',
    functionText: 'Measures lunar vibrations & moonquakes',
    iconKey: 'wave',
  },
  {
    id: 'magnetometer',
    instrument: 'Magnetometer',
    functionText: 'Studies lunar magnetic fields',
    iconKey: 'magnet',
  },
  {
    id: 'heatflow',
    instrument: 'Heat-Flow Probe',
    functionText: 'Measures heat beneath the surface',
    iconKey: 'flame',
  },
  {
    id: 'camera',
    instrument: 'Surveyor Camera',
    functionText: 'Captures images of the lunar surface',
    iconKey: 'camera',
  },
  {
    id: 'antenna',
    instrument: 'High-Gain Antenna',
    functionText: 'Sends & receives communication signals',
    iconKey: 'radio',
  },
  {
    id: 'solarpanel',
    instrument: 'Solar Panel',
    functionText: 'Converts sunlight into electrical energy',
    iconKey: 'sun',
  },
  {
    id: 'battery',
    instrument: 'Silver-Zinc Battery',
    functionText: 'Stores electrical energy for systems',
    iconKey: 'battery',
  },
  {
    id: 'samplebox',
    instrument: 'Sample Container',
    functionText: 'Holds collected lunar rock & soil',
    iconKey: 'box',
  },
];
