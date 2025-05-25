import { Request, Response, NextFunction } from 'express';

// Generic validation middleware
export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // This is a placeholder for actual validation logic
      // In a real app, you would use a library like Joi, Zod, or class-validator
      // to validate the request body against a schema
      
      // For now, we'll just check if required fields exist
      const requiredFields = ['name', 'email']; // Example required fields
      
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({ error: `Field '${field}' is required` });
        }
      }
      
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Validation failed', details: error });
    }
  };
}; 