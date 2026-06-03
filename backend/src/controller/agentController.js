// controllers/AgentController.js
import CatchAsync from "#shared/utils/response.js";
import AgentService from "#service/agentService.js";
import { AgentChatResponseDto } from "#dtos/agentDto.js";
import { chatSchema } from "#validation/agentValidation.js";
import validate from "#validation/validation.js";

/**
 * Controller untuk endpoint AI agent chat
 * @class AgentController
 */
class AgentController {
  constructor() {
    this.agentService = new AgentService();
  }

  /**
   * Chat dengan AI agent
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  chat = CatchAsync.run(async (req, res) => {
    const { message } = validate(chatSchema, req.body);
    const userId = req.user.id;

    const result = await this.agentService.chat(userId, message);

    res.status(200).json({
      success: true,
      message: result.cached ? "Jawaban dari cache" : "Jawaban dari AI",
      data: new AgentChatResponseDto(result),
    });
  });
}

export default new AgentController();
