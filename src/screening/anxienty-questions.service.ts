import { Injectable } from '@nestjs/common';
import { Scale } from '@prisma/client';
interface Option {
  text: string;
  score: number;
}

interface Question {
  question: string;
  options: Option[];
}

@Injectable()
export class AncientQuestions {
  private readonly defaultOptions: Option[] = [
    { text: 'Not at all', score: 0 },
    { text: 'Mildly, but it didn’t bother me so much', score: 1 },
    { text: 'Moderately -it wasn’t pleasant', score: 2 },
    { text: 'Severely bothered -it bothered me a lot', score: 3 },
  ];

  public questions: Question[] = [
    {
      question: 'Feeling nervous, anxious or on edge',
      options: this.defaultOptions,
    },
    {
      question:
        'Not being able to stop/control worrying/ worrying about different things',
      options: this.defaultOptions,
    },
    {
      question: 'Trouble relaxing',
      options: this.defaultOptions,
    },
    {
      question: 'Being so restless that it’s hard to sit in one place (still)',
      //'Being so restless that it’s hard to sit still',
      options: this.defaultOptions,
    },
    {
      question: 'Becoming easily annoyed or irritated',
      options: this.defaultOptions,
    },
    {
      question: 'Feeling afraid, as if something bad (awful) might happen',
      //'Feeling afraid, as if something awful might happen',
      options: this.defaultOptions,
    },
  ];

  public async getAnxietyScale(value: number) {
    if (value >= 0 && value <= 4) {
      return Scale.MINIMAL_OR_NONE;
    } else if (value >= 5 && value <= 9) {
      return Scale.MILD;
    } else if (value >= 10 && value <= 12) {
      return Scale.MODERATE;
    } else {
      return Scale.SEVERE;
    }
  }
}
