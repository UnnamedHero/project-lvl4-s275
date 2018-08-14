export const hasErrors = errors => Object.keys(errors).length > 0;

export const makeErrorsObj = errObject => ({
  errors: Object.keys(errObject)
    .map(err => ({
      path: err,
      message: errObject[err],
    })),
});
