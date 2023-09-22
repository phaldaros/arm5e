const DEFAULT_WOUND = "dead";

const SIZES_AND_WOUNDS = {
  "-4": {
    1: "light",
    2: "medium",
    3: "heavy",
    4: "incap",
    5: "dead"
  },
  "-3": {
    1: "light",
    3: "medium",
    5: "heavy",
    7: "incap",
    9: "dead"
  },
  "-2": {
    1: "light",
    4: "medium",
    7: "heavy",
    10: "incap",
    13: "dead"
  },
  "-1": {
    1: "light",
    5: "medium",
    9: "heavy",
    13: "incap",
    17: "dead"
  },
  0: {
    1: "light",
    6: "medium",
    11: "heavy",
    16: "incap",
    21: "dead"
  },
  1: {
    1: "light",
    7: "medium",
    13: "heavy",
    19: "incap",
    25: "dead"
  },
  2: {
    1: "light",
    8: "medium",
    15: "heavy",
    22: "incap",
    29: "dead"
  },
  3: {
    1: "light",
    9: "medium",
    17: "heavy",
    25: "incap",
    33: "dead"
  }
};

export { SIZES_AND_WOUNDS, DEFAULT_WOUND };
