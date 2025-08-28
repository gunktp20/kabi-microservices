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
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    healthCheck: '/health'
  },
  REALTIME_SERVICE: {
    name: 'realtime-service',
    url: process.env.REALTIME_SERVICE_URL || 'http://localhost:3005',
    healthCheck: '/health'
  }
};

export const ROUTES = [
  {
    path: '/api/auth',
    target: SERVICES.USER_SERVICE.url,
    pathRewrite: {
      '^/api/auth': '/auth'
    }
  },
  {
    path: '/api/users',
    target: SERVICES.USER_SERVICE.url,
    pathRewrite: {
      '^/api/users': '/users'
    }
  },
  {
    path: '/api/boards',
    target: SERVICES.BOARD_SERVICE.url,
    pathRewrite: {
      '^/api/boards': '/api/boards'
    }
  },
  {
    path: '/api/columns',
    target: SERVICES.BOARD_SERVICE.url,
    pathRewrite: {
      '^/api/columns': '/api/columns'
    }
  },
  {
    path: '/api/tasks',
    target: SERVICES.TASK_SERVICE.url,
    pathRewrite: {
      '^/api/tasks': '/api/tasks'
    }
  },
  {
    path: '/api/assignments',
    target: SERVICES.NOTIFICATION_SERVICE.url,
    pathRewrite: {
      '^/api/assignments': '/api/assignments'
    }
  },
  {
    path: '/api/notifications',
    target: SERVICES.NOTIFICATION_SERVICE.url,
    pathRewrite: {
      '^/api/notifications': '/api/notifications'
    }
  },
  {
    path: '/api/invitations',
    target: SERVICES.NOTIFICATION_SERVICE.url,
    pathRewrite: {
      '^/api/invitations': '/api/invitations'
    }
  },
  {
    path: '/api/realtime',
    target: SERVICES.REALTIME_SERVICE.url,
    pathRewrite: {
      '^/api/realtime': '/api/events'
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