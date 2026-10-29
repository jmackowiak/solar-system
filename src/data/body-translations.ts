import type { Body } from "./bodies";

export type BodyCopy = Pick<Body, "name" | "kind" | "description" | "fact">;

export const englishBodyCopy: Record<string, BodyCopy> = {
  sun: {
    name: "Sun",
    kind: "Star · yellow dwarf",
    description:
      "It all begins here. In our star’s core, hydrogen turns into helium, releasing the energy that warms the planets and sustains life on Earth.",
    fact: "The Sun does not rotate as a rigid sphere: regions near the equator turn faster than those near the poles.",
  },
  mercury: {
    name: "Mercury",
    kind: "Terrestrial planet",
    description:
      "A small, rocky world close to the Sun. Craters cover its grey surface, while the almost complete lack of an atmosphere means enormous temperature differences between day and night.",
    fact: "From one sunrise to the next, 176 Earth days pass here — two years on Mercury.",
  },
  venus: {
    name: "Venus",
    kind: "Terrestrial planet",
    description:
      "Bright from afar, hostile up close. Beneath a thick veil of clouds lie a scorching surface and a dense atmosphere dominated by carbon dioxide.",
    fact: "One full rotation of Venus relative to the stars takes longer than its orbit around the Sun. It also rotates in the opposite direction to Earth.",
  },
  earth: {
    name: "Earth",
    kind: "Terrestrial planet · our home",
    description:
      "Our blue dot in space. Oceans, drifting clouds and a thin atmosphere make this the only world we know of where life exists.",
    fact: "Sunlight takes about eight minutes to reach Earth. When we look at our star, we see its recent past.",
  },
  mars: {
    name: "Mars",
    kind: "Terrestrial planet",
    description:
      "Rust-red deserts, polar ice caps and traces of ancient rivers. Earth’s chilly neighbour preserves the story of a world that once had liquid water on its surface.",
    fact: "Mars is home to Olympus Mons — the largest volcano in the Solar System.",
  },
  jupiter: {
    name: "Jupiter",
    kind: "Gas giant",
    description:
      "The largest of the planets. Its light zones and dark belts are clouds racing in opposite directions above a deep atmosphere of hydrogen and helium.",
    fact: "The Great Red Spot is a powerful storm larger than Earth, observed for hundreds of years.",
  },
  saturn: {
    name: "Saturn",
    kind: "Gas giant",
    description:
      "Surrounded by vast rings of ice and rock, Saturn is one of the most recognisable worlds. Powerful winds lie beneath its softly coloured clouds.",
    fact: "Saturn’s average density is lower than that of water. It is the only planet in the Solar System with this property.",
  },
  uranus: {
    name: "Uranus",
    kind: "Ice giant",
    description:
      "A seemingly tranquil, blue-green giant. Methane in its atmosphere absorbs red light, while an unusually tilted axis makes the planet appear to roll along its orbit.",
    fact: "Uranus’s axis is tilted by about 98°. Near the poles, night can last around 21 Earth years.",
  },
  neptune: {
    name: "Neptune",
    kind: "Ice giant",
    description:
      "The last of the eight planets, far from the Sun’s warmth. Beneath this blue world’s cold clouds rage the fastest winds known in the Solar System.",
    fact: "Neptune’s winds can exceed 2,000 km/h, even though so little solar energy reaches the planet.",
  },
};

export const englishTourStops: { id: string; title: string; text: string }[] = [
  {
    id: "sun",
    title: "The star that gives us life",
    text: "Almost all the mass in our Solar System is concentrated here. In the Sun’s core, hydrogen turns into helium — releasing energy.",
  },
  {
    id: "earth",
    title: "Our blue address",
    text: "Oceans, a thin atmosphere and an extraordinary balance. This is the only world where we know life exists.",
  },
  {
    id: "jupiter",
    title: "A world without solid ground",
    text: "Look at the bands of clouds. Storms larger than Earth rage through this gas giant’s atmosphere.",
  },
  {
    id: "saturn",
    title: "Billions of fragments, one ring",
    text: "From afar, they look like a smooth sheet. Up close, Saturn’s rings are countless pieces of ice and rock.",
  },
  {
    id: "neptune",
    title: "At the edge of our planetary journey",
    text: "Sunlight takes about four hours to reach this world. Beyond lies a realm of icy worlds.",
  },
];
