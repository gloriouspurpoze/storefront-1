import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Copy, 
  Share2, 
  Gift, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface UserReferralStats {
  total_referrals_made: number;
  total_referrals_received: number;
  total_rewards_earned: number;
  pending_rewards: number;
  completed_referrals: number;
  active_referral_code?: string;
  referral_history: Array<{
    id: string;
    referral_code: string;
    status: string;
    created_at: string;
    completed_at?: string;
  }>;
}

interface ReferralReward {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reward_type: string;
  created_at: string;
  credited_at?: string;
}

const ReferralDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserReferralStats | null>(null);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      if (isMounted) {
        await fetchData()
      }
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, []);

  const fetchData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const [statsRes, rewardsRes] = await Promise.all([
        fetch(`/api/referrals/user/${userId}/stats`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/referrals/rewards', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      const [statsData, rewardsData] = await Promise.all([
        statsRes.json(),
        rewardsRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (rewardsData.success) setRewards(rewardsData.data.rewards);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      setGeneratingCode(true);
      const userId = localStorage.getItem('userId');
      
      const response = await fetch('/api/referrals/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          reward_type: 'discount',
          referrer_reward: 25,
          referee_reward: 15,
          completion_requirement: 'first_order',
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
      } else {
        alert(data.message || 'Error generating referral code');
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      alert('Error generating referral code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const shareReferralCode = (code: string) => {
    const shareText = `Join me on Fixer Marketplace! Use my referral code: ${code} to get 15% off your first order!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Fixer Marketplace',
        text: shareText,
        url: window.location.origin,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareText);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'outline',
      completed: 'default',
      expired: 'destructive',
      cancelled: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Referral Dashboard</h1>
        {!stats?.active_referral_code && (
          <Button onClick={generateReferralCode} disabled={generatingCode}>
            {generatingCode ? 'Generating...' : 'Generate Referral Code'}
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Referrals Made</p>
                <p className="text-2xl font-bold">{stats?.total_referrals_made || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats?.completed_referrals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rewards Earned</p>
                <p className="text-2xl font-bold">₹{stats?.total_rewards_earned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats?.pending_rewards || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="code" className="space-y-4">
        <TabsList>
          <TabsTrigger value="code">My Referral Code</TabsTrigger>
          <TabsTrigger value="history">Referral History</TabsTrigger>
          <TabsTrigger value="rewards">My Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.active_referral_code ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-muted px-4 py-2 rounded-lg">
                      <code className="text-lg font-mono">{stats.active_referral_code}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyReferralCode(stats.active_referral_code!)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => shareReferralCode(stats.active_referral_code!)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Share your referral code with friends</li>
                      <li>• They get 15% off their first order</li>
                      <li>• You earn ₹500 when they complete their first order</li>
                      <li>• No limit on how many people you can refer!</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Referral Code</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate a referral code to start earning rewards by referring friends!
                  </p>
                  <Button onClick={generateReferralCode} disabled={generatingCode}>
                    {generatingCode ? 'Generating...' : 'Generate Referral Code'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.referral_history.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {referral.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(referral.status)}
                          {getStatusBadge(referral.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(referral.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {referral.completed_at 
                          ? new Date(referral.completed_at).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>My Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credited</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell className="capitalize">{reward.reward_type}</TableCell>
                      <TableCell>${reward.amount} {reward.currency}</TableCell>
                      <TableCell>{getStatusBadge(reward.status)}</TableCell>
                      <TableCell>
                        {reward.credited_at 
                          ? new Date(reward.credited_at).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(reward.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralDashboard;
