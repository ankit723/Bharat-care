import { Request, Response } from 'express';
import prisma from '../utils/db';
import { ReviewCreationData, RequestWithBody } from '../types/index';

// Get all reviews
export const getReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        doctor: true,
        hospital: true,
        compounder: true
      }
    });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Get review by ID
export const getReviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        doctor: true,
        hospital: true,
        compounder: true
      }
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
};

// Create a new review
export const createReview = async (
  req: RequestWithBody<ReviewCreationData>,
  res: Response
): Promise<void> => {
  try {
    const reviewData = req.body;
    const review = await prisma.review.create({
      data: reviewData
    });
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

// Update review
export const updateReview = async (
  req: RequestWithBody<Partial<ReviewCreationData>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const reviewData = req.body;
    
    const review = await prisma.review.update({
      where: { id },
      data: reviewData
    });
    
    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete review
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.review.delete({
      where: { id }
    });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}; 