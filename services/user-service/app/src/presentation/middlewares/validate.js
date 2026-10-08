const SOURCES = {
  body: { label: 'body', get: (req) => req.body },
  params: { label: 'path', get: (req) => req.params },
};

// Validates a request part with zod; error shape mimics FastAPI's 422 response.
// Parsed data is exposed as req.valid.<source>.
export const validate = (source, schema) => (req, res, next) => {
  const { label, get } = SOURCES[source];
  const result = schema.safeParse(get(req) ?? {});
  if (!result.success) {
    return res.status(422).json({
      detail: result.error.issues.map((issue) => ({
        loc: [label, ...issue.path],
        msg: issue.message,
        type: issue.code,
      })),
    });
  }
  req.valid = { ...req.valid, [source]: result.data };
  next();
};
