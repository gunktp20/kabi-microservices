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
    timeout: 10000, // 10 seconds timeout
    proxyTimeout: 10000, // 10 seconds proxy timeout
    onError: (err, req: Request, res: Response) => {
      console.error(`Proxy error for ${req.url}:`, err.message);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'The requested service is not available. Please try again later.'
      });
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[Gateway] Proxying ${req.method} ${req.url} to ${options.target}`);
      console.log(`[Gateway] Headers:`, req.headers);
      console.log(`[Gateway] Body:`, req.body);
      console.log(`[Gateway] Content-Length:`, req.headers['content-length']);
      
      // Ensure content-length is set for POST requests
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Gateway] Response ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    }
  });
};