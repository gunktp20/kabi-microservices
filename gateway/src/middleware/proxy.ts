import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { Request, Response } from 'express';

interface ProxyOptions {
  target: string;
  pathRewrite?: Record<string, string>;
  changeOrigin?: boolean;
}

export const createServiceProxy = (options: ProxyOptions): RequestHandler => {
  return createProxyMiddleware({
    target: options.target,
    changeOrigin: options.changeOrigin ?? true,
    pathRewrite: options.pathRewrite,
    onError: (err, req: Request, res: Response) => {
      console.error(`Proxy error for ${req.url}:`, err.message);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'The requested service is not available. Please try again later.'
      });
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[Gateway] Proxying ${req.method} ${req.url} to ${options.target}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Gateway] Response ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    }
  });
};