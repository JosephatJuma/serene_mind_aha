import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { PrismaClient, Client, Status } from '@prisma/client';
import { DepressionQuestions } from './depression-questions.service';
import { AncientQuestions } from './anxienty-questions.service';
import { IncomingMessageDto } from 'src/whatsapp/dto/message.dto';

@Injectable()
export class ScreeningService {
  private logger = new Logger(ScreeningService.name);
  constructor(
    private whatsappService: WhatsappService,
    private prisma: PrismaClient,
    private depressionQuestions: DepressionQuestions,
    private anxientQuestions: AncientQuestions,
  ) {}
  async handleIncomingMessage(message: any): Promise<void> {
    console.log(message);
    if (message.type === 'text') {
      this.logger.log('New message received');
      await this.processMessage(
        message.text.body,
        message.from,
        message?.timestamp,
      );
    } else if (message.type == 'interactive') {
      await this.processMessage(
        message?.interactive.button_reply?.title,
        message.from,
        message?.timestamp,
      );
    } else {
      await this.whatsappService.sendWhatsappMessage(
        message.from,
        'Could not process message, please send a text message',
      );
    }
  }
  // Function to send the next question based on the client's progress
  // Function to send the next question based on the client's progress
  private async askNextQuestion(client: Client) {
    const questionIndex = client.currentQuestionIndex ?? 0;

    const question =
      client.screeningStatus === 'DEPRESSION'
        ? this.depressionQuestions.questions[questionIndex]
        : this.anxientQuestions.questions[questionIndex];
    await this.prisma.client.update({
      where: { whatsapp_number: client.whatsapp_number },
      data: { currentQuestionIndex: questionIndex + 1 },
    });
    // Format question and options into a message
    if (questionIndex === 0) {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Over the last two weeks, how often have you been bothered by any of the following problems? Please select the statements below to help me assess you better',
      );
    }
    const message =
      `${question.question}\n\n` +
      question.options
        .map((opt: any, index: number) => `${index + 1}. ${opt.text}`)
        .join('\n');

    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      message,
    );
  }
  private async repeatTheQuestion(client: Client) {
    const questionIndex = client.currentQuestionIndex ?? 0;

    const question =
      client.screeningStatus === 'DEPRESSION'
        ? this.depressionQuestions.questions[questionIndex - 1]
        : this.anxientQuestions.questions[questionIndex - 1];
    const message =
      `${question.question}\n\n` +
      question.options
        .map((opt: any, index: number) => `${index + 1}. ${opt.text}`)
        .join('\n');

    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      message,
    );
  }

  // Function to handle user responses
  private async handleResponse(
    client: Client,
    response: string,
    timestamp: number,
  ) {
    if (isNaN(parseInt(response))) {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Please select a right number',
      );
      await this.repeatTheQuestion(client);
    } else {
      const questionIndex = client.currentQuestionIndex;
      const question =
        client.screeningStatus === 'DEPRESSION'
          ? this.depressionQuestions.questions[questionIndex]
          : this.anxientQuestions.questions[questionIndex];
      if (question) {
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
              status: client.screeningStatus,
              timestamp: timestamp,
            },
          });

          // Update the client's question progress
          const questionLength =
            client.screeningStatus === 'DEPRESSION'
              ? this.depressionQuestions.questions.length - 1
              : this.anxientQuestions.questions.length - 1;
          if (questionIndex < questionLength) {
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
          await this.repeatTheQuestion(client); // Repeat the question
        }
      }
    }
  }

  // Function to calculate and send the final score
  private async calculateAndSendFinalScore(client: Client) {
    const responses = await this.prisma.clientResponse.findMany({
      where: { clientId: client.id, status: client.screeningStatus },
    });

    const totalScore = responses.reduce(
      (sum, response) => sum + response.score,
      0,
    );
    // console.log(totalScore);
    const newStatus: Status =
      client.screeningStatus === 'DEPRESSION' ? 'ANXIETY' : 'COMPLETED';
    const updatedClient = await this.prisma.client.update({
      where: { whatsapp_number: client.whatsapp_number },
      data: { screeningStatus: newStatus, currentQuestionIndex: 0 },
    });
    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      `Thank you for your responses. Your score is ${totalScore}`,
    );
    if (newStatus == 'ANXIETY') {
      this.askNextQuestion(updatedClient);
    } else {
      this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'You have come to the end of the screeing',
      );
    }
  }

  private async processMessage(
    message: string,
    phoneNumber: string,
    timestamp: number,
  ) {
    const client: Client = await this.prisma.client.findUnique({
      where: { whatsapp_number: phoneNumber },
    });
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
          await this.handleScreeningResponse(client, message);
          break;
        case 'DEPRESSION':
        case 'ANXIETY':
          await this.handleResponse(client, message, timestamp);
          break;
        case 'COMPLETED':
          await this.whatsappService.sendWhatsappMessage(
            phoneNumber,
            'Thanks for taking time to do the mental health assessment\n\nYou have already done an assessment recently, you can carryout another assessment after two weeks',
          );
          break;
        default:
          await this.whatsappService.sendWhatsappMessage(
            phoneNumber,
            'Could not process the message',
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
      return this.sendScreeningQuestion(client);
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
      //Screen Question
      return this.sendScreeningQuestion(client);
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
    return this.sendScreeningQuestion(client);
    // await this.whatsappService.sendWhatsappMessage(
    //   client.whatsapp_number,
    //   `Have you experienced any of the following in the past two weeks\n\n1.Persistent sadness\n2. Loss of interest/ pleasure in activities\n3. Change in appetite or weight loss\n4. Insomnia\n5. Feeling worthlessness`,
    // );
  }
  private async sendScreeningQuestion(client: Client) {
    // await this.whatsappService.sendWhatsappMessage(
    //     client.whatsapp_number,
    //     `Have you experienced any of the following in the past two weeks\n\n1. Persistent sadness\n2. Loss of interest/ pleasure in activities\n3. Change in appetite or weight loss\n4. Insomnia\n5. Feeling worthlessness`,
    //   );
    await this.whatsappService.sendWhatsappInteractiveMessage(
      client.whatsapp_number,
      `Have you experienced any of the following in the past two weeks\n\n1. Persistent sadness\n2. Loss of interest/ pleasure in activities\n3. Change in appetite or weight loss\n4. Insomnia\n5. Feeling worthlessness`,
      [
        { id: '1', title: 'Yes' },
        { id: '2', title: 'No' },
        //{ id: '3', title: 'Nearly everyday' },
        // { id: '4', title: 'More than half' },
      ],
    );
  }
  private async handleScreeningResponse(client: Client, message: string) {
    const updateDClient = await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'DEPRESSION' },
    });
    await this.prisma.clientResponse.create({
      data: {
        clientId: client.id,
        status: Status.SCREENING,
        score: 0,
        answer: message,
        question:
          'Have you experienced any of the following in the past two weeks',
      },
    });

    await this.askNextQuestion(updateDClient);
  }
}
