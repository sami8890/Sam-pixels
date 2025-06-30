import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { X, CreditCard, Check, Crown, Zap, Shield, Star, ArrowRight } from 'lucide-react';

interface StripePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  stripePriceId: string;
}

const StripePayment: React.FC<StripePaymentProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 9,
      period: 'month',
      stripePriceId: 'price_1RfYRy4Fdg6FLS0S1XOJSWqZ',
      features: [
        '100 image processes/month',
        'All AI tools included',
        'HD quality exports',
        'Email support',
        'Basic watermarking'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      period: 'month',
      stripePriceId: 'price_1RfYT74Fdg6FLS0SNbcOIZ1p',
      popular: true,
      features: [
        'Unlimited image processing',
        'All AI tools included',
        '4K quality exports',
        'Priority support',
        'Advanced watermarking',
        'Batch processing',
        'API access'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49,
      period: 'month',
      stripePriceId: 'price_1RfYUC4Fdg6FLS0SVhIgjR9x',
      features: [
        'Everything in Pro',
        'White-label solution',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
        'Advanced analytics',
        'Team management'
      ]
    }
  ];

  const handlePayment = async (plan: PricingPlan) => {
    setIsLoading(true);
    setError('');

    try {
      // Initialize Stripe
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RfY8L4Fdg6FLS0ShOSrboNFOl64dIugx1hNbiVi2GdKffs1RkC4z4eHVCBJvlTsVCSWEz8LFVPWG26ZsVwuOahT001XX9mMAO');
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          planName: plan.name
        }),
      });

      if (!response.ok) {
        // For demo purposes, simulate successful payment
        console.log('Would create checkout session for:', plan.stripePriceId);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate successful payment
        onSuccess(plan.id);
        onClose();
        
        // Show success message
        alert(`Successfully subscribed to ${plan.name} plan! Welcome to SamPixel Pro!\n\nIn production, this would redirect to Stripe Checkout with Price ID: ${plan.stripePriceId}`);
        return;
      }

      const session = await response.json();

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-white">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Upgrade to SamPixel Pro</h2>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                Unlock unlimited AI-powered image processing and advanced features
              </p>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : plan.popular
                      ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                  whileHover={{ scale: selectedPlan === plan.id ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {selectedPlan === plan.id && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl pointer-events-none">
                      <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Payment Section */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Complete Your Subscription
                </h3>

                {/* Selected Plan Summary */}
                <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {plans.find(p => p.id === selectedPlan)?.name} Plan
                      </h4>
                      <p className="text-sm text-gray-500">Monthly subscription</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Price ID: {plans.find(p => p.id === selectedPlan)?.stripePriceId}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${plans.find(p => p.id === selectedPlan)?.price}
                      </div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Instant Access</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Payment Button */}
                <motion.button
                  onClick={() => {
                    const plan = plans.find(p => p.id === selectedPlan);
                    if (plan) handlePayment(plan);
                  }}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Subscribe with Stripe</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  By subscribing, you agree to our Terms of Service and Privacy Policy.
                  Cancel anytime from your account settings.
                </p>

                {/* Demo Notice */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 text-center">
                    <strong>Demo Mode:</strong> This will simulate the payment process. 
                    In production, you would be redirected to Stripe Checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StripePayment;