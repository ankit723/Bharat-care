"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReview = exports.createReview = exports.getReviewById = exports.getReviews = void 0;
const db_1 = __importDefault(require("../utils/db"));
// Get all reviews
const getReviews = async (_req, res) => {
    try {
        const reviews = await db_1.default.review.findMany({
            include: {
                doctor: true,
                hospital: true,
                compounder: true
            }
        });
        res.json(reviews);
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};
exports.getReviews = getReviews;
// Get review by ID
const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await db_1.default.review.findUnique({
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
    }
    catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ error: 'Failed to fetch review' });
    }
};
exports.getReviewById = getReviewById;
// Create a new review
const createReview = async (req, res) => {
    try {
        const reviewData = req.body;
        const review = await db_1.default.review.create({
            data: reviewData
        });
        res.status(201).json(review);
    }
    catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
};
exports.createReview = createReview;
// Update review
const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const reviewData = req.body;
        const review = await db_1.default.review.update({
            where: { id },
            data: reviewData
        });
        res.json(review);
    }
    catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Failed to update review' });
    }
};
exports.updateReview = updateReview;
// Delete review
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.review.delete({
            where: { id }
        });
        res.status(204).end();
    }
    catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
};
exports.deleteReview = deleteReview;
