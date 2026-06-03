// validations/AgentValidation.js
import Joi from "joi";

const chatSchema = Joi.object({
  message: Joi.string().min(1).max(500).required().messages({
    "any.required": "Pesan harus diisi",
    "string.empty": "Pesan tidak boleh kosong",
    "string.min": "Pesan minimal 1 karakter",
    "string.max": "Pesan maksimal 500 karakter",
  }),
});

export { chatSchema };