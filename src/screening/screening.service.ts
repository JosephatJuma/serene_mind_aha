import { Injectable } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { PrismaClient ,Client} from '@prisma/client';
@Injectable()
export class ScreeningService {
    constructor(private whatsappService:WhatsappService,private prisma:PrismaClient){}
  // Function to send the next question based on the client's progress
async function askNextQuestion(client: Client) {
  const questionIndex = client.currentQuestionIndex;
  const question = questions[questionIndex];

  // Format question and options into a message
  const message = `${question.question}\n` + 
    question.options.map((opt, index) => `${index + 1}. ${opt.text}`).join("\n");

  await sendWhatsappMessage(client.whatsapp_number, message);
}

// Function to handle user responses
async function handleResponse(client: Client, response: string) {
  const questionIndex = client.currentQuestionIndex;
  const question = questions[questionIndex];

  // Convert response to an index
  const selectedOption = parseInt(response) - 1;

  if (selectedOption >= 0 && selectedOption < question.options.length) {
    const score = question.options[selectedOption].score;

    // Store response and score in the database
    await prisma.clientResponses.create({
      data: {
        clientId: client.id,
        question: question.question,
        answer: question.options[selectedOption].text,
        score: score,
      },
    });

    // Update the client's question progress
    if (questionIndex < questions.length - 1) {
      await prisma.client.update({
        where: { id: client.id },
        data: { currentQuestionIndex: questionIndex + 1 },
      });

      // Ask the next question
      await askNextQuestion(client);
    } else {
      // All questions completed - calculate the final score
      await calculateAndSendFinalScore(client);
    }
  } else {
    // Send an error message if the response is invalid
    await sendWhatsappMessage(
      client.whatsapp_number,
      "Invalid response. Please reply with the number corresponding to your choice."
    );
    await askNextQuestion(client);  // Repeat the question
  }
}

// Function to calculate and send the final score
async function calculateAndSendFinalScore(client: Client) {
  const responses = await prisma.clientResponses.findMany({
    where: { clientId: client.id },
  });

  const totalScore = responses.reduce((sum, response) => sum + response.score, 0);

  await sendWhatsappMessage(
    client.whatsapp_number,
    `Thank you for your responses. Your assessment score is: ${totalScore}`
  );
}
  
}
