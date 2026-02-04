export type Beat = {
  length: number;
  note: string;
};

export type Measure = {
  beats: Array<Beat>;
  beat: (beat: Beat) => Measure;
};

export type Phrase = {
  measures: Array<Measure>;
  measure: (measure: Measure) => Phrase;
};

export type Loop = {
  phrases: Array<Phrase>;
  phrase: (phrase: Phrase) => Loop;
};

export function loop(): Loop {
  return {
    phrases: [],
    phrase: (phrase: Phrase) => {
      this.phrases.push(phrase);
      return this;
    },
  };
}

export function phrase(): Phrase {
  return {
    measures: [],
    measure: (measure: Measure) => {
      this.measures.push(measure);
      return this;
    },
  };
}

export function measure(): Measure {
  return {
    beats: [],
    beat: (beat: Beat) => {
      this.beats.push(beat);
      return this;
    },
  };
}
