import { Injectable } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { PrismaClient, Client, Status } from '@prisma/client';
import { DepressionQuestionsClass } from './depression-questions.service';

@Injectable()
export class ScreeningService {
  constructor(
    private whatsappService: WhatsappService,
    private prisma: PrismaClient,
    private depressionQuestions: DepressionQuestionsClass,
  ) {}
  async handleIncomingMessage(message: any): Promise<void> {
    if (message.type === 'text') {
      await this.processMessage(message.text.body, message.from);
    } else if (message.type == 'options') {
      // Not at all (0-1 days ).
      // Several days ( 2-6 days).
      // More than half the days (7 -11 days)
      // Nearly everyday (1 2-14 days)

      await this.whatsappService.sendWhatsappInteractiveMessage(
        message.from,
        'Over the last two weeks, how often have you been bothered by any of the following problems? Please select/ tick the statements below to help me assess you better:\n\nLittle interest/ pleasure in doing things\n',
        [
          { id: '1', title: 'Not at all' },
          { id: '2', title: 'Several days' },
          { id: '3', title: 'Nearly everyday' },
          // { id: '4', title: 'More than half' },
        ],
      );
    } else {
      await this.whatsappService.sendWhatsappMessage(
        message.from,
        'Could not process message ',
      );
    }
  }
  // Function to send the next question based on the client's progress
  async askNextQuestion(client: Client) {
    const questionIndex = client.currentQuestionIndex ?? 0;
    const question = this.depressionQuestions.questions[questionIndex];
    await this.prisma.client.update({
      where: { whatsapp_number: client.whatsapp_number },
      data: { currentQuestionIndex: questionIndex + 1 },
    });
    // Format question and options into a message
    const message =
      `${questionIndex === 0 ? 'Over the last two weeks, how often have you been bothered by any of the following problems? Please select the statements below to help me assess you better:\n\n' : ''}${question.question}\n` +
      question.options
        .map((opt: any, index: number) => `${index + 1}. ${opt.text}`)
        .join('\n');

    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      message,
    );
  }

  // Function to handle user responses
  async handleResponse(client: Client, response: string) {
    const questionIndex = client.currentQuestionIndex;
    const question = this.depressionQuestions.questions[questionIndex];

    // Convert response to an index
    const selectedOption = parseInt(response) - 1;

    if (selectedOption >= 0 && selectedOption < question.options.length) {
      const score = question.options[selectedOption].score;

      // Store response and score in the database
      await this.prisma.clientResponse.create({
        data: {
          clientId: client.id,
          question: question.question,
          answer: question.options[selectedOption].text,
          score: score,
        },
      });

      // Update the client's question progress
      if (questionIndex < this.depressionQuestions.questions.length - 1) {
        await this.prisma.client.update({
          where: { id: client.id },
          data: { currentQuestionIndex: questionIndex + 1 },
        });

        // Ask the next question
        await this.askNextQuestion(client);
      } else {
        // All questions completed - calculate the final score
        await this.calculateAndSendFinalScore(client);
      }
    } else {
      // Send an error message if the response is invalid
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Invalid response. Please reply with the number corresponding to your choice.',
      );
      await this.askNextQuestion(client); // Repeat the question
    }
  }

  // Function to calculate and send the final score
  async calculateAndSendFinalScore(client: Client) {
    const responses = await this.prisma.clientResponse.findMany({
      where: { clientId: client.id },
    });

    const totalScore = responses.reduce(
      (sum, response) => sum + response.score,
      0,
    );
    console.log(totalScore);
    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      `Thank you for your responses. Next Is Axienty`,
    );
  }

  private async processMessage(message: string, phoneNumber: string) {
    console.log(message, phoneNumber);

    const client: Client = await this.prisma.client.findUnique({
      where: { whatsapp_number: phoneNumber },
    });

    // const client=await this.prisma.client.create({data:{whatsapp_number:phoneNumber, name:'James'}})

    if (client == null) {
      await this.prisma.client.create({
        data: { whatsapp_number: phoneNumber, screeningStatus: Status.WELCOME },
      });
      return await this.whatsappService.sendWhatsappMessage(
        phoneNumber,
        'Hello there 👋\n\nWelcome to the AHA mental health online platform. My name is Serene Mind AHA, your health partner. Please note that we value your privacy and that whatever you share here is highly confidential.\n\nWould you tell me about yourself?',
      );
    } else {
      switch (client.screeningStatus) {
        case null:
        case 'WELCOME':
          await this.handleWelcomeMessage(client, message);
          break;
        case 'NAME':
          await this.handleNameResponse(client, message);
          break;
        case 'AGE':
          await this.handleAgeResponse(client, message);
          break;
        case 'GENDER':
          await this.handleGenderResponse(client, message);
          break;
        case 'LOCATION':
          await this.handleLocationResponse(client, message);
          break;

        case 'NEXT_OF_KIN':
          await this.handleNextOfKinResponse(client, message);
          break;
        case 'NEXT_OF_KIN_PHONE':
          await this.handleNextOfKinPhoneResponse(client, message);
          break;
        case 'SCREENING':
          //await this.handleScreeningResponse(client, message);
          await this.askNextQuestion(client);
          break;
        default:
          await this.whatsappService.sendWhatsappMessage(
            phoneNumber,
            'Invalid state',
          );
      }
    }
  }

  private async handleWelcomeMessage(client: Client, message: string) {
    if (message.toLowerCase() === 'yes') {
      await this.prisma.client.update({
        where: { id: client.id },
        data: { screeningStatus: 'NAME' },
      });
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'What is your name?',
      );
    } else if (message.toLowerCase() === 'no') {
      await this.prisma.client.update({
        where: { id: client.id },
        data: { screeningStatus: 'SCREENING' },
      });
      await this.startScreening(client);
    } else {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Please reply with Yes or No\n\nWould you tell me about yourself?',
      );
    }
  }

  private async handleNameResponse(client: Client, message: string) {
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'AGE', name: message },
    });
    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      `Hello ${message}, What is your age?`,
    );
  }

  private async handleAgeResponse(client: Client, message: string) {
    if (isNaN(Number(message))) {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Age must be a number\n\nWhat is your age?',
      );
    } else {
      await this.prisma.client.update({
        where: { id: client.id },
        data: { screeningStatus: 'GENDER', age: parseInt(message) },
      });
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'What is your gender?',
      );
    }
  }

  private async handleGenderResponse(client: Client, message: string) {
    if (
      message.toLowerCase() !== 'male' &&
      message.toLowerCase() !== 'female'
    ) {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Please provide a valid gender, gender should be Male or Female',
      );
    } else {
      await this.prisma.client.update({
        where: { id: client.id },
        data: { screeningStatus: 'LOCATION', gender: message.toUpperCase() },
      });
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Where do you stay?',
      );
    }
  }

  private async handleLocationResponse(client: Client, message: string) {
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'NEXT_OF_KIN', location: message },
    });
    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      'Are you staying with someone?',
    );
  }
  private async handleNextOfKinResponse(client: Client, message: string) {
    if (message.toLowerCase() == 'yes') {
      await this.prisma.client.update({
        where: { id: client.id },
        data: {
          screeningStatus: 'NEXT_OF_KIN_PHONE',
          is_staying_with_someone: true,
        },
      });
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Please provide the phone number of the person you are staying with ',
      );
    } else if (message.toLowerCase() == 'no') {
      await this.prisma.client.update({
        where: { id: client.id },
        data: { screeningStatus: 'SCREENING', is_staying_with_someone: true },
      });
      //await this.handleScreeningResponse(client, 'Screening begins....');
      await this.askNextQuestion(client);
    } else {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Invalid response, please respond with yes or no\n\nAre you staying with someone?',
      );
    }
  }
  private async handleNextOfKinPhoneResponse(client: Client, message: string) {
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'SCREENING', someone_phone_number: message },
    });
    //await this.handleScreeningResponse(client, '');
    await this.askNextQuestion(client);
  }

  private async startScreening(client: Client) {
    if (!client.isScreened) {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Starting screening...',
      );
      // Implement screening questions logic here
      // ...
    } else {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Thank you for completing the screening. A specialist will reach out to you soon.',
      );
    }
  }

  private async handleScreeningResponse(client: Client, message: string) {
    // Implement screening question handling logic here
    // ...
    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      'Screening Begins....',
    );
  }
}
