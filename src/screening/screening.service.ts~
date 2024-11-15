import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { PrismaClient, Client, Status, Scale } from '@prisma/client';
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

    // send instrunction when assessment begins
    if (questionIndex === 0 && client.screeningStatus == 'DEPRESSION') {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Over the last two weeks, how often have you been bothered by any of the following problems? Please select the statements below to help me assess you better',
      );
    }
    // Format question and options into a message
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
      const questionIndex = client.currentQuestionIndex - 1; //sub 1 since index is -1
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
    const newStatus: Status =
      client.screeningStatus === 'DEPRESSION' ? 'ANXIETY' : 'COMPLETED';
    const updatedClient = await this.prisma.client.update({
      where: { whatsapp_number: client.whatsapp_number },
      data: { screeningStatus: newStatus, currentQuestionIndex: 0 },
    });

    if (newStatus === 'ANXIETY') {
      this.askNextQuestion(updatedClient);
    } else {
      const responses = await this.prisma.clientResponse.findMany({
        where: {
          clientId: client.id,
          status: { in: ['DEPRESSION', 'ANXIETY'] },
        },
      });

      // Separate and calculate scores for depression and anxiety
      const { depressionScore, anxietyScore } = responses.reduce(
        (totals, response) => {
          if (response.status === 'DEPRESSION') {
            totals.depressionScore += response.score;
          } else if (response.status === 'ANXIETY') {
            totals.anxietyScore += response.score;
          }
          return totals;
        },
        { depressionScore: 0, anxietyScore: 0 },
      );

      // Fetch scales in parallel
      const [depressionScale, anxietyScale] = await Promise.all([
        this.depressionQuestions.getDepressionScale(depressionScore),
        this.anxientQuestions.getAnxietyScale(anxietyScore),
      ]);

      // Save the result
      const result = await this.prisma.assessmentResult.create({
        data: {
          anxietyScore,
          depressionScore,
          depressionScale,
          anxietyScale,
          clientId: client.id,
        },
      });
      await this.sendAnxietyResult(result.anxietyScale, client);
      await this.sendDepressionResult(result.depressionScale, client);

      // Combine messages for better readability
      const summaryMessage = `Thank you for your responses.\n\n*Your score is:*\n\nDepression: ${result.depressionScore}\nAnxiety: ${result.anxietyScore}`;
      const finalMessage = `We have come to the end of our assessment and you did great! I want you to know that you are very brave for seeking help.\n\nPlease consider contacting us on the number provided should you need to speak with our psychiatric nurse, counsellor, or social worker. You should also consider attending the Mental Health Clinic which runs every Thursday at Access Centre in Kabuusu. Our team is waiting to support you. See you there. Bye.`;

      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        summaryMessage,
      );
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        finalMessage,
      );
    }
  }

  private async sendDepressionResult(scale: Scale, client: Client) {
    if (scale == 'MINIMAL_OR_NONE' || 'MILD') {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        'Check out this video\n\nhttps://youtube.com/shorts/LYMpsu9WfQ0?feature=shar)',
      );
    }
  }

  private async sendAnxietyResult(scale: Scale, client: Client) {
    if (scale == 'SEVERE') {
      // await this.whatsappService.sendWhatsappMessage(
      //   '',
      //   `You have a Severe Depression case to attend to.\n\nClient Name: ${client.name}\n WhatsApp Number: ${client.whatsapp_number}\nAge: ${client.age}\nCategory: ${result.depressionScale.toLocaleLowerCase()}`,
      // );
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        `Please come to the Kabuusu Access Centre for further analysis by the Psychiatrist Nurse/ Psychologist/ Psychiatrist.\n\n Watch this video in the mean-time\n\nhttps://youtu.be/FbFPq1bUKEY`,
      );
    }
    if (scale == 'MINIMAL_OR_NONE' || 'MILD') {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        `Watch this short video!\n\nhttps://youtu.be/WWloIAQpMcQ\n\n- Get someplace quiet and sit down.\n- Take note of the time\n- Take slow deep breathes while counting to 10, for 15-20 minutes. This should help you feel better\n- Have a glass of cool water\n\nIf after 20- 30 minutes, you are still feeling uneasy, please seek medical help at the nearest government aided health facility.`,
      );
    }
    if (scale == 'MODERATELY_SEVERE' || 'MODERATE' || 'SEVERE') {
      await this.whatsappService.sendWhatsappMessage(
        client.whatsapp_number,
        `Watch this short video!\n\nhttps://youtu.be/RWMCdP5Vujo?si=Lf0rRLTXUSUEy_6R\n\nModerate and severe Anxiety is manageable by our Mental Health Team at Kabuusu Access Centre. We run a clinic every Thursday from 9am to 4pm. You are most welcome!`,
      );
    }
  }

  private async confirmViewResults(client: Client) {
    // await this.prisma.client.update({
    //   where: { id: client.id },
    //   data: { screeningStatus: 'NEXT_OF_KIN', location: message },
    // });
    await this.whatsappService.sendWhatsappInteractiveMessage(
      client.whatsapp_number,
      `Your assessment from our interaction is nearly ready, remember this doesn’t replace a professional examination. I encourage you to visit the UNHCR Access Centre for a more detailed assessment and support with our experienced psychiatrist, nurses, counsellors and social workers.\n\nAre you ready to review your assessment?`,
      [
        { id: '1', title: 'Let’s do it' },
        { id: '2', title: 'Not Now' },
      ],
    );
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
      return await this.whatsappService.sendWhatsappInteractiveMessage(
        phoneNumber,
        'Hello there 👋\n\nWelcome to the AHA mental health online platform. My name is Serene Mind AHA, your health partner. Please note that we value your privacy and that whatever you share here is highly confidential.\n\nWould you tell me about yourself?',
        [
          { id: '1', title: 'Yes' },
          { id: '2', title: 'No' },
        ],
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
      await this.whatsappService.sendWhatsappInteractiveMessage(
        client.whatsapp_number,
        'What is your gender?',
        [
          { id: '1', title: 'Male' },
          { id: '2', title: 'Female' },
        ],
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
    await this.whatsappService.sendWhatsappInteractiveMessage(
      client.whatsapp_number,
      'Are you staying with someone?',
      [
        { id: '1', title: 'Yes' },
        { id: '2', title: 'No' },
      ],
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
    await this.whatsappService.sendWhatsappInteractiveMessage(
      client.whatsapp_number,
      `Have you experienced any of the following in the past two weeks\n\n1. Persistent sadness\n2. Loss of interest/ pleasure in activities\n3. Change in appetite or weight loss\n4. Insomnia\n5. Feeling worthlessness`,
      [
        { id: '1', title: 'Yes' },
        { id: '2', title: 'No' },
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
