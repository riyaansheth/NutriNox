function validateFields(body, validations) {
  for (const rule of validations) {
    const val = body[rule.field];
    if (rule.required && (val === undefined || val === null || val.toString().trim() === '')) {
      return { valid: false, message: `Field '${rule.field}' is required` };
    }
    if (val && rule.maxLength && val.length > rule.maxLength) {
      return { valid: false, message: `Field '${rule.field}' exceeds max length of ${rule.maxLength}` };
    }
    if (val && rule.enum && !rule.enum.includes(val)) {
      return { valid: false, message: `Field '${rule.field}' must be one of: ${rule.enum.join(', ')}` };
    }
  }
  return { valid: true };
}

module.exports = {
  validateChat: (body) => validateFields(body, [{ field: 'message', required: true, maxLength: 1000 }]),
  validateLogFood: (body) => validateFields(body, [{ field: 'text', required: true, maxLength: 500 }]),
  validateAnalyze: (body) => {
    let result = validateFields(body, [
      { field: 'type', required: true, enum: ['symptom', 'explain', 'habits'] },
      { field: 'input', required: false, maxLength: 500 }
    ]);
    if (!result.valid) return result;
    if (['symptom', 'explain'].includes(body.type) && !body.input) {
      return { valid: false, message: "Field 'input' is required for this type" };
    }
    return { valid: true };
  },
  validateSuggest: (body) => validateFields(body, [{ field: 'craving', required: true, maxLength: 200 }])
};
