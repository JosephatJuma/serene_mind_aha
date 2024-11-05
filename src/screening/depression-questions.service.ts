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
export class DepressionQuestionsClass {
  private readonly defaultOptions: Option[] = [
    { text: "Not at all (0-1 days)", score: 0 },
    { text: "Several days (2-6 days)", score: 1 },
    { text: "More than half the days (7-11 days)", score: 2 },
    { text: "Nearly every day (12-14 days)", score: 3 },
  ];

  public questions: Question[] = [
    {
      question: "Little interest or pleasure in doing things?",
      options: this.defaultOptions,
    },
    {
      question: "Feeling sad, depressed, or hopeless?",
      options: this.defaultOptions,
    },
    {
      question: "Trouble sleeping, staying awake, or sleeping too much?",
      options: this.defaultOptions,
    },
    {
      question:'Feeling tired or having little energy?',
      options:this.defaultOptions
    },
    {
      question:'Poor appetite or overeating',
      options:this.defaultOptions
    },
    {
      question:'Feeling bad about yourself, or that you are a failure (Worthlessness) or have let yourself or your family down?',
      options:this.defaultOptions
    },
    
    {
      question:'Trouble concentrating on things such as reading the newspaper or watching television?',
      options:this.defaultOptions
    },
    {
      question:'Moving or speaking so slowly that other people could have noticed or the opposite: being so fidgety or restless that you have been moving around a lot more than usual.',
      options:this.defaultOptions
    },
    {
      question:'Thoughts that you would be better off dead or of hurting /killing yourself in some way if yes administer the suicide assessment.',
      options:this.defaultOptions
    },
   
  ];
}
