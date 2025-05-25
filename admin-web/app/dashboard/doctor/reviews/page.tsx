'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reviewsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

const ReviewsPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await reviewsApi.getAll({ doctorId: user.id });
        
        if (response.data && Array.isArray(response.data)) {
          // Sort reviews by date (newest first)
          const sortedReviews = [...response.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setReviews(sortedReviews);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to load reviews. Please try again later.');
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  const calculateAverageRating = () => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getFilteredReviews = () => {
    if (!Array.isArray(reviews)) return [];
    
    switch (selectedTab) {
      case 'positive':
        return reviews.filter(review => review.rating >= 4);
      case 'neutral':
        return reviews.filter(review => review.rating === 3);
      case 'negative':
        return reviews.filter(review => review.rating <= 2);
      default:
        return reviews;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  const filteredReviews = getFilteredReviews();
  const reviewsCount = Array.isArray(reviews) ? reviews.length : 0;

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">My Reviews</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-4xl font-bold">{calculateAverageRating()}</div>
              <div className="ml-2 text-3xl text-yellow-500">★</div>
              <div className="ml-2 text-sm text-muted-foreground">
                ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewsCount > 0 ? reviews.filter(review => review.rating === star).length : 0;
                const percentage = reviewsCount > 0 ? Math.round((count / reviewsCount) * 100) : 0;
                
                return (
                  <div key={star} className="flex items-center text-sm">
                    <div className="w-8">{star}★</div>
                    <div className="flex-1 mx-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-muted-foreground">{count}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filter Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="positive">Positive</TabsTrigger>
                <TabsTrigger value="neutral">Neutral</TabsTrigger>
                <TabsTrigger value="negative">Negative</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTab === 'all' 
              ? 'All Reviews' 
              : `${selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Reviews`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(filteredReviews) && filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                      <span className="ml-2 font-medium">
                        {review.rating}/5
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                  
                  {review.comment ? (
                    <div className="mt-2">
                      <p className="text-foreground">&quot;{review.comment}&quot;</p>
                    </div>
                  ) : (
                    <div className="text-sm italic text-muted-foreground">No comment provided</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {selectedTab === 'all' 
                ? 'No reviews yet.' 
                : `No ${selectedTab} reviews found.`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsPage; 