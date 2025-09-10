/**
 * HTTP Status Codes
 * Định nghĩa các mã trạng thái HTTP chuẩn
 */

export const HTTP_STATUS = {
  // Success 2xx
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Error 4xx
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Server Error 5xx
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
}

export const STATUS_MESSAGES = {
  [HTTP_STATUS.OK]: 'Success',
  [HTTP_STATUS.CREATED]: 'Created successfully',
  [HTTP_STATUS.NO_CONTENT]: 'No content',
  [HTTP_STATUS.BAD_REQUEST]: 'Bad request',
  [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized',
  [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'Not found',
  [HTTP_STATUS.CONFLICT]: 'Conflict',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Validation failed',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [HTTP_STATUS.NOT_IMPLEMENTED]: 'Not implemented',
  [HTTP_STATUS.BAD_GATEWAY]: 'Bad gateway',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service unavailable'
}
