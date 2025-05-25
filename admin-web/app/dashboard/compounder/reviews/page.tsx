'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reviewsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Star, Loader2, MessageSquare, Calendar, User } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  patient?: {
    id: string;
    name: string;
    email: string;
  };
}

const CompounderReviewsPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    fiveStarReviews: 0,
    withComments: 0
  });

  useEffect(() => {
    fetchReviews();
  }, [user]);

  useEffect(() => {
    // Filter reviews based on search query
    if (!Array.isArray(reviews)) {
      setFilteredReviews([]);
      return;
    }
    
    if (searchQuery.trim() === '') {
      setFilteredReviews(reviews);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = reviews.filter(
        review =>
          review.patient?.name?.toLowerCase().includes(query) ||
          review.patient?.email?.toLowerCase().includes(query) ||
          review.comment?.toLowerCase().includes(query) ||
          review.rating.toString().includes(query)
      );
      setFilteredReviews(filtered);
    }
  }, [searchQuery, reviews]);

  const fetchReviews = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // For now, this is a placeholder since we need compounder API endpoints
      // In the actual implementation, this would be:
      // const response = await reviewsApi.getAll({ compounderId: user.id });
      
      const reviewsData: Review[] = [];
      
      setReviews(reviewsData);
      setFilteredReviews(reviewsData);
      
      // Calculate stats
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / reviewsData.length;
        const fiveStarCount = reviewsData.filter(review => review.rating === 5).length;
        const withCommentsCount = reviewsData.filter(review => review.comment && review.comment.trim() !== '').length;
        
        setStats({
          totalReviews: reviewsData.length,
          averageRating: Math.round(avgRating * 10) / 10,
          fiveStarReviews: fiveStarCount,
          withComments: withCommentsCount
        });
      } else {
        setStats({
          totalReviews: 0,
          averageRating: 0,
          fiveStarReviews: 0,
          withComments: 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      setError(error?.response?.data?.message || 'Failed to load reviews. Please try again later.');
      setReviews([]);
      setFilteredReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Patient Reviews</h2>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Reviews about your services
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Patient feedback received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <div className="flex items-center gap-1 mt-1">
              {renderStars(Math.round(stats.averageRating))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fiveStarReviews}</div>
            <p className="text-xs text-muted-foreground">
              Excellent feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withComments}</div>
            <p className="text-xs text-muted-foreground">
              Detailed feedback
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search reviews by patient name, comment, or rating..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {searchQuery ? `Found: ${filteredReviews.length}` : `Total: ${reviews.length}`} reviews
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>Reviews and ratings from patients</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review.id} className="border border-muted">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
                            {review.patient?.name?.charAt(0).toUpperCase() || 'P'}
                          </div>
                        </Avatar>
                        <div>
                          <div className="font-medium">{review.patient?.name || 'Anonymous'}</div>
                          <div className="text-sm text-muted-foreground">{review.patient?.email || 'No email'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {renderStars(review.rating)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    {review.comment && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery 
                  ? 'No reviews found matching your search' 
                  : 'No reviews yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search criteria to find reviews.' 
                  : 'Patient reviews and ratings will appear here once you start receiving feedback about your services.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Management Tips */}
      {reviews.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Building Your Reputation</CardTitle>
            <CardDescription>Tips for getting better patient reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Provide Excellent Service</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Be professional and courteous</li>
                  <li>• Listen to patient concerns</li>
                  <li>• Provide accurate medication guidance</li>
                  <li>• Maintain clean and organized workspace</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Follow Up</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check medication effectiveness</li>
                  <li>• Answer questions promptly</li>
                  <li>• Build long-term relationships</li>
                  <li>• Ask for feedback politely</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompounderReviewsPage; 