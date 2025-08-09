import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { SERVICES } from '../config/services';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  url: string;
  responseTime?: number;
  error?: string;
}

export const checkServiceHealth = async (serviceName: string): Promise<ServiceHealth> => {
  const service = Object.values(SERVICES).find(s => s.name === serviceName);
  
  if (!service) {
    return {
      name: serviceName,
      status: 'unhealthy',
      url: 'unknown',
      error: 'Service configuration not found'
    };
  }

  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${service.url}${service.healthCheck}`, {
      timeout: 5000
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: service.name,
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      url: service.url,
      responseTime
    };
  } catch (error: any) {
    return {
      name: service.name,
      status: 'unhealthy',
      url: service.url,
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
};

export const healthCheckHandler = async (req: Request, res: Response) => {
  const serviceNames = Object.values(SERVICES).map(s => s.name);
  
  const healthChecks = await Promise.all(
    serviceNames.map(name => checkServiceHealth(name))
  );
  
  const allHealthy = healthChecks.every(check => check.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    gateway: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    services: healthChecks,
    overall: allHealthy ? 'healthy' : 'degraded'
  });
};