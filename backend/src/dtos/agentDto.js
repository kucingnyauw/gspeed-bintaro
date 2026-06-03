// dto/AgentDto.js

/**
 * DTO untuk response chat agent
 * @class AgentChatResponseDto
 */
class AgentChatResponseDto {
    constructor(data) {
      this.reply = data.reply;
      this.cached = data.cached ?? false;
      this.toolCalls = data.toolCalls?.map((tc) => ({
        name: tc.name,
        args: tc.args ?? {},
      })) ?? [];
    }
  }
  
  export { AgentChatResponseDto };