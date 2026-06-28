export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    req.body = result.body ?? req.body;
    if (result.params) {
      Object.assign(req.params, result.params);
    }
    if (result.query) {
      req.validatedQuery = result.query;
    }
    next();
  };
}
