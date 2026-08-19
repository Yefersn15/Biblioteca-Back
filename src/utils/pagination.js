const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

exports.getPagination = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));
  return { page, limit, offset: (page - 1) * limit };
};

exports.paginatedResponse = (res, { rows, count }, { page, limit }) =>
  res.status(200).json({
    success: true,
    message: 'OK',
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
