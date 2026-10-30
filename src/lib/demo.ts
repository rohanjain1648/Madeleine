import type { Intake } from "./types";

export interface DemoPerson {
  key: string;
  teaser: string;
  intake: Intake;
}

/** Fictional people, written so judges can try Madeleine in one click across cultures. */
export const DEMO_PEOPLE: DemoPerson[] = [
  {
    key: "rose",
    teaser: "Brooklyn seamstress who copied Audrey Hepburn's dresses",
    intake: {
      name: "Rose",
      birthYear: 1942,
      hometown: "Brooklyn, New York",
      currentCity: "Boca Raton, Florida",
      language: "English",
      loves:
        "Ella Fitzgerald, Frank Sinatra, Roman Holiday, Audrey Hepburn, I Love Lucy, egg creams, Coney Island, dancing at the Roseland Ballroom",
      lifeStory:
        "Worked as a seamstress in the Garment District for thirty years and sewed her own dresses copied from the movies. Married Sol in 1963. Two daughters, Debbie and Ellen.",
      avoid: "Hospitals. Her husband Sol's illness.",
    },
  },
  {
    key: "raj",
    teaser: "Bombay railway clerk who never missed a Sunday film",
    intake: {
      name: "Raj",
      birthYear: 1950,
      hometown: "Bombay (Mumbai), India",
      currentCity: "Leicester, United Kingdom",
      language: "English",
      loves:
        "Kishore Kumar, Mohammed Rafi, Rajesh Khanna, Sholay, Amitabh Bachchan, cricket on the radio, Irani cafés, walks on Marine Drive",
      lifeStory:
        "Railway clerk at Victoria Terminus. Moved to Leicester in 1976 and ran a corner shop with his wife Meena. Took the family to a Hindi film every Sunday.",
      avoid: "Partition stories.",
    },
  },
  {
    key: "margaret",
    teaser: "Liverpool typist who danced at the Cavern Club",
    intake: {
      name: "Margaret",
      birthYear: 1947,
      hometown: "Liverpool, England",
      currentCity: "Manchester, United Kingdom",
      language: "English",
      loves:
        "The Beatles, Cilla Black, Dusty Springfield, Doctor Who, Coronation Street, A Hard Day's Night, Julie Christie, fish and chips, summers in Blackpool",
      lifeStory: "Typist at the Liver Building. Danced at the Cavern Club as a teenager. Three grandchildren who call her Nan.",
      avoid: "",
    },
  },
  {
    key: "carmen",
    teaser: "Mexico City teacher who sang in the church choir",
    intake: {
      name: "Carmen",
      birthYear: 1955,
      hometown: "Mexico City, Mexico",
      currentCity: "Los Angeles, California",
      language: "Spanish",
      loves:
        "Pedro Infante, José José, Juan Gabriel, Rocío Dúrcal, El Chavo del Ocho, Cantinflas, mole de su mamá, paseos en trajinera en Xochimilco",
      lifeStory: "Primary school teacher for 35 years. Sang in the church choir. Moved to Los Angeles in 1984 with her two sons.",
      avoid: "The 1985 earthquake.",
    },
  },
];
