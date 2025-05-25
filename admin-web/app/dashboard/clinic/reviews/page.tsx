'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reviewsApi, clinicsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Star, Loader2, MessageSquare, Calendar, Stethoscope, Pill } from 'lucide-react';

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
  doctor?: {
    id: string;
    name: string;
  };
  compounder?: {
    id: string;
    name: string;
  };
  type: 'doctor' | 'compounder';
}

const ClinicReviewsPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'doctor' | 'compounder'>('all');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    doctorReviews: 0,
    compounderReviews: 0,
    fiveStarReviews: 0,
    withComments: 0
  });

  useEffect(() => {
    fetchReviews();
  }, [user]);

  useEffect(() => {
    // Filter reviews based on search query and type filter
    if (!Array.isArray(reviews)) {
      setFilteredReviews([]);
      return;
    }
    
    let filtered = reviews;
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(review => review.type === filterType);
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        review =>
          review.patient?.name?.toLowerCase().includes(query) ||
          review.patient?.email?.toLowerCase().includes(query) ||
          review.comment?.toLowerCase().includes(query) ||
          review.doctor?.name?.toLowerCase().includes(query) ||
          review.compounder?.name?.toLowerCase().includes(query) ||
          review.rating.toString().includes(query)
      );
    }
    
    setFilteredReviews(filtered);
  }, [searchQuery, filterType, reviews]);

  const fetchReviews = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch clinic information first to get the doctor and compounder
      const clinicResponse = await clinicsApi.getById(user.id);
      const clinic = clinicResponse.data;
      
      let allReviews: Review[] = [];
      
      // Fetch reviews for the clinic's doctor (if assigned)
      if (clinic?.doctor?.id) {
        try {
          const doctorReviewsResponse = await reviewsApi.getAll({ doctorId: clinic.doctor.id });
          const doctorReviews = (doctorReviewsResponse.data || []).map((review: any) => ({
            ...review,
            type: 'doctor' as const,
            doctor: clinic.doctor
          }));
          allReviews = [...allReviews, ...doctorReviews];
        } catch (error) {
          console.error('Error fetching doctor reviews:', error);
        }
      }
      
      // Fetch reviews for the clinic's compounder (if assigned)
      if (clinic?.compounder?.id) {
        try {
          const compounderReviewsResponse = await reviewsApi.getAll({ compounderId: clinic.compounder.id });
          const compounderReviews = (compounderReviewsResponse.data || []).map((review: any) => ({
            ...review,
            type: 'compounder' as const,
            compounder: clinic.compounder
          }));
          allReviews = [...allReviews, ...compounderReviews];
        } catch (error) {
          console.error('Error fetching compounder reviews:', error);
        }
      }
      
      setReviews(allReviews);
      setFilteredReviews(allReviews);
      
      // Calculate stats
      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / allReviews.length;
        const doctorReviewsCount = allReviews.filter(review => review.type === 'doctor').length;
        const compounderReviewsCount = allReviews.filter(review => review.type === 'compounder').length;
        const fiveStarCount = allReviews.filter(review => review.rating === 5).length;
        const withCommentsCount = allReviews.filter(review => review.comment && review.comment.trim() !== '').length;
        
        setStats({
          totalReviews: allReviews.length,
          averageRating: Math.round(avgRating * 10) / 10,
          doctorReviews: doctorReviewsCount,
          compounderReviews: compounderReviewsCount,
          fiveStarReviews: fiveStarCount,
          withComments: withCommentsCount
        });
      } else {
        setStats({
          totalReviews: 0,
          averageRating: 0,
          doctorReviews: 0,
          compounderReviews: 0,
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
        <h2 className="text-3xl font-bold">Clinic Reviews</h2>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Reviews for your clinic staff
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              All clinic reviews
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
            <CardTitle className="text-sm font-medium">Doctor Reviews</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.doctorReviews}</div>
            <p className="text-xs text-muted-foreground">
              Doctor feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compounder Reviews</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.compounderReviews}</div>
            <p className="text-xs text-muted-foreground">
              Compounder feedback
            </p>
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

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterType === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilterType('doctor')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterType === 'doctor' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Doctor ({stats.doctorReviews})
          </button>
          <button
            onClick={() => setFilterType('compounder')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterType === 'compounder' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Compounder ({stats.compounderReviews})
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search reviews by patient, staff, comment, or rating..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {searchQuery || filterType !== 'all' ? `Found: ${filteredReviews.length}` : `Total: ${reviews.length}`} reviews
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>Reviews and ratings for your clinic staff</CardDescription>
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
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {review.type === 'doctor' ? (
                              <>
                                <Stethoscope className="h-3 w-3" />
                                <span>Review for Dr. {review.doctor?.name}</span>
                              </>
                            ) : (
                              <>
                                <Pill className="h-3 w-3" />
                                <span>Review for {review.compounder?.name} (Compounder)</span>
                              </>
                            )}
                          </div>
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
                {searchQuery || filterType !== 'all'
                  ? 'No reviews found matching your criteria' 
                  : 'No reviews yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria to find reviews.' 
                  : 'Patient reviews and ratings for your clinic staff will appear here once you start receiving feedback.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinic Performance Tips */}
      {reviews.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Building Your Clinic Reputation</CardTitle>
            <CardDescription>Tips for improving patient satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Doctor Excellence</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Provide thorough consultations</li>
                  <li>• Listen actively to patient concerns</li>
                  <li>• Explain treatments clearly</li>
                  <li>• Follow up on patient progress</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Compounder Excellence</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Accurate medication preparation</li>
                  <li>• Clear dosage instructions</li>
                  <li>• Professional medication counseling</li>
                  <li>• Timely prescription fulfillment</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Clinic Environment</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Maintain cleanliness and hygiene</li>
                  <li>• Ensure comfortable waiting areas</li>
                  <li>• Minimize wait times</li>
                  <li>• Friendly and helpful staff</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Patient Communication</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Respectful and courteous interactions</li>
                  <li>• Clear appointment scheduling</li>
                  <li>• Prompt response to inquiries</li>
                  <li>• Patient privacy and confidentiality</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClinicReviewsPage; 