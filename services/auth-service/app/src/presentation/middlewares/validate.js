// Validates req.body with a zod schema. Error shape mimics FastAPI's 422 response.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      detail: result.error.issues.map((issue) => ({
        loc: ['body', ...issue.path],
        msg: issue.message,
        type: issue.code,
      })),
    });
  }
  req.body = result.data;
  next();
};
