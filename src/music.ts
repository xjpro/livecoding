export type Beat = {
  length: number;
  note: string;
};

export type Measure = {
  beats: Array<Beat>;
  add: (beat: Beat) => Measure;
};

export type Phrase = {
  measures: Array<Measure>;
  add: (measure: Measure) => Phrase;
};

export type Loop = {
  phrases: Array<Phrase>;
  add: (phrase: Phrase) => Loop;
};

export function loop(): Loop {
  return {
    phrases: [],
    add: (phrase: Phrase) => {
      this.phrases.push(phrase);
      return this;
    },
  };
}

export function phrase(): Phrase {
  return {
    measures: [],
    add: (measure: Measure) => {
      this.measures.push(measure);
      return this;
    },
  };
}

export function measure(): Measure {
  return {
    beats: [],
    add: (beat: Beat) => {
      this.beats.push(beat);
      return this;
    },
  };
}
