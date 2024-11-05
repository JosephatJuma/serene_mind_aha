import { Injectable } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { PrismaClient, Client, Status } from '@prisma/client';
import { DepressionQuestions } from './depression-questions.service';
import { AncientQuestions } from './anxienty-questions.service';
import { IncomingMessageDto } from 'src/whatsapp/dto/message.dto';

@Injectable()
export class ScreeningService {
  constructor(
    private whatsappService: WhatsappService,
    private prisma: PrismaClient,
    private depressionQuestions: DepressionQuestions,
    private anxientQuestions: AncientQuestions,
  ) {}
  async handleIncomingMessage(message: IncomingMessageDto): Promise<void> {
    if (message.type === 'text') {
      console.log(message)
      await this.processMessage(message.text.body, message.from, message?.timestamp);
    }

    // else if (message.type == 'options') {
    //   await this.whatsappService.sendWhatsappInteractiveMessage(
    //     message.from,
    //     'Over the last two weeks, how often have you been bothered by any of the following problems? Please select/ tick the statements below to help me assess you better:\n\nLittle interest/ pleasure in doing things\n',
    //     [
    //       { id: '1', title: 'Not at all' },
    //       { id: '2', title: 'Several days' },
    //       { id: '3', title: 'Nearly everyday' },
    //       // { id: '4', title: 'More than half' },
    //     ],
    //   );
    // }
    else {
      await this.whatsappService.sendWhatsappMessage(
        message.from,
        'Could not process message, please a text message',
      );
    }
  }
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
  private async handleResponse(client: Client, response: string, timestamp:number) {
    if (isNaN(parseInt(response))) {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Please select a right number',
      );
      await this.askNextQuestion(client);
    } else {
      const questionIndex = client.currentQuestionIndex;
      const question =
        client.screeningStatus === 'DEPRESSION'
          ? this.depressionQuestions.questions[questionIndex]
          : this.anxientQuestions.questions[questionIndex];

      // Convert response to an index
      const selectedOption = parseInt(response) - 1;

      if (selectedOption >= 0 && selectedOption <= question.options.length) {
        const score = question.options[selectedOption].score;

        // Store response and score in the database
        await this.prisma.clientResponse.create({
          data: {
            clientId: client.id,
            question: question.question,
            answer: question.options[selectedOption].text,
            score: score,
            status: client.screeningStatus,
            timestamp:timestamp
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
        await this.askNextQuestion(client); // Repeat the question
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
    await this.prisma.client.update({
      where: { whatsapp_number: client.whatsapp_number },
      data: { screeningStatus: newStatus },
    });
    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      `Thank you for your responses. Your score is ${totalScore}`,
    );
  }

  private async processMessage(message: string, phoneNumber: string, timestamp:number) {
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
        case "ANXIETY":
          await this.handleResponse(client, message,timestamp);
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
      await this.askNextQuestion(client);
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
    await this.whatsappService.sendWhatsappMessage(
      client.whatsapp_number,
      `Have you experienced any of the following in the past two weeks\nSelect all the applicable seperated with a comma(,)\n1.Persistent sadness\n2. Loss of interest/ pleasure in activities\n3. Change in appetite or weight loss\n4. Insomnia\n5. Feeling worthlessness`,
    );
  }

  private async handleScreeningResponse(client: Client, message: string) {
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'DEPRESSION', someone_phone_number: message },
    });

    await this.askNextQuestion(client);
  }
}
