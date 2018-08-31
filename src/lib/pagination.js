const makeBegin = ({ limit }) => ({
  value: '<<',
  disabled: false,
  current: false,
  query: { offset: 0, limit },
});

const makeEnd = ({ maxPages, limit }) => {
  const offset = (maxPages - 1) * limit;
  return ({
    value: '>>',
    disabled: false,
    current: false,
    query: { offset, limit },
  });
};

const makePrev = ({ offset, limit }) => {
  const expectedOffset = offset - limit;
  const disabled = expectedOffset < 0;
  const newOffset = disabled ? 0 : expectedOffset;
  return ({
    value: '<',
    disabled,
    current: false,
    query: { offset: newOffset, limit },
  });
};

const makeNext = ({ total, offset, limit }) => {
  console.log(`t: ${total}, o: ${offset}, l: ${limit}`);
  const expectedOffset = offset + limit;
  const disabled = expectedOffset >= total;
  const newOffset = disabled ? offset : expectedOffset;
  return ({
    value: '>',
    current: false,
    disabled,
    query: { offset: newOffset, limit },
  });
};

const makeCurrent = ({
  offset, limit, current, maxPages,
}) => ({
  value: `page ${current + 1} of ${maxPages}`,
  disabled: true,
  query: { offset, limit },
});

const makeTotal = ({ total, offset, limit }) => ({
  value: `Total items: ${total}`,
  disabled: true,
  query: { offset, limit },
});

const makeModelOpts = (total, offset = 0, limit = 5) => {
  const maxPages = Math.ceil(total / limit);
  const expectedPage = Math.floor(offset / limit);

  const actualPage = expectedPage > maxPages ? maxPages : expectedPage;

  return ({
    total, maxPages, offset, limit, current: actualPage,
  });
};

export default (total, offset, limit) => {
  const modelOpts = makeModelOpts(total, offset, limit);
  return [
    makeBegin(modelOpts),
    makePrev(modelOpts),
    makeCurrent(modelOpts),
    makeNext(modelOpts),
    makeEnd(modelOpts),
    makeTotal(modelOpts),
  ];
};
