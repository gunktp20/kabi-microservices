export const SERVICES = {
  USER_SERVICE: {
    name: 'user-service',
    url: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    healthCheck: '/health'
  },
  BOARD_SERVICE: {
    name: 'board-service',
    url: process.env.BOARD_SERVICE_URL || 'http://localhost:3002',
    healthCheck: '/health'
  },
  TASK_SERVICE: {
    name: 'task-service',
    url: process.env.TASK_SERVICE_URL || 'http://localhost:3003',
    healthCheck: '/health'
  },
  NOTIFICATION_SERVICE: {
    name: 'notification-service',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
    healthCheck: '/health'
  },
  REALTIME_SERVICE: {
    name: 'realtime-service',
    url: process.env.REALTIME_SERVICE_URL || 'http://localhost:3004',
    healthCheck: '/health'
  }
};

export const ROUTES = [
  {
    path: '/api/v1/auth',
    target: SERVICES.USER_SERVICE.url,
    pathRewrite: {
      '^/api/v1/auth': '/api/v1/auth'
    }
  },
  {
    path: '/api/v1/users',
    target: SERVICES.USER_SERVICE.url,
    pathRewrite: {
      '^/api/v1/users': '/api/v1/users'
    }
  },
  {
    path: '/api/v1/boards',
    target: SERVICES.BOARD_SERVICE.url,
    pathRewrite: {
      '^/api/v1/boards': '/api/v1/boards'
    }
  },
  {
    path: '/api/v1/columns',
    target: SERVICES.BOARD_SERVICE.url,
    pathRewrite: {
      '^/api/v1/columns': '/api/v1/columns'
    }
  },
  {
    path: '/api/v1/tasks',
    target: SERVICES.TASK_SERVICE.url,
    pathRewrite: {
      '^/api/v1/tasks': '/api/v1/tasks'
    }
  },
  {
    path: '/api/v1/assignments',
    target: SERVICES.NOTIFICATION_SERVICE.url,
    pathRewrite: {
      '^/api/v1/assignments': '/api/v1/assignments'
    }
  },
  {
    path: '/api/v1/notifications',
    target: SERVICES.NOTIFICATION_SERVICE.url,
    pathRewrite: {
      '^/api/v1/notifications': '/api/v1/notifications'
    }
  },
  {
    path: '/api/v1/invitations',
    target: SERVICES.NOTIFICATION_SERVICE.url,
    pathRewrite: {
      '^/api/v1/invitations': '/api/v1/invitations'
    }
  }
];

// WebSocket proxy configuration
export const WEBSOCKET_CONFIG = {
  path: '/socket.io',
  target: SERVICES.REALTIME_SERVICE.url,
  changeOrigin: true,
  ws: true,
};