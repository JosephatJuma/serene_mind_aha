import { Injectable } from '@nestjs/common';

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
      question: 'Being so restless that it’s hard to sit still',
      options: this.defaultOptions,
    },
    {
      question: 'Becoming easily annoyed or irritated',
      options: this.defaultOptions,
    },
    {
      question: 'Feeling afraid, as if something awful might happen',
      options: this.defaultOptions,
    },
    { question: '', options: this.defaultOptions },
  ];
}
