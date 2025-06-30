# Stripe Product Setup Guide

## Step 1: Navigate to Product Catalog

In your Stripe dashboard (I can see you're already there), click on **"Product catalog"** in the left sidebar under the "Products" section.

## Step 2: Create Your First Product

Click the **"+ Add product"** button and create these 3 products:

### Product 1: SamPixel Starter
- **Name**: `SamPixel Starter`
- **Description**: `100 image processes per month with all AI tools`
- **Pricing Model**: `Recurring`
- **Price**: `$9.00 USD`
- **Billing Period**: `Monthly`
- **Tax Code**: Leave default
- Click **"Save product"**
- **COPY THE PRICE ID** (starts with `price_`) - you'll need this!

### Product 2: SamPixel Pro  
- **Name**: `SamPixel Pro`
- **Description**: `Unlimited image processing with all premium features`
- **Pricing Model**: `Recurring`
- **Price**: `$19.00 USD`
- **Billing Period**: `Monthly`
- **Tax Code**: Leave default
- Click **"Save product"**
- **COPY THE PRICE ID** (starts with `price_`) - you'll need this!

### Product 3: SamPixel Enterprise
- **Name**: `SamPixel Enterprise`
- **Description**: `Everything in Pro plus white-label and team features`
- **Pricing Model**: `Recurring`
- **Price**: `$49.00 USD`
- **Billing Period**: `Monthly`
- **Tax Code**: Leave default
- Click **"Save product"**
- **COPY THE PRICE ID** (starts with `price_`) - you'll need this!

## Step 3: Get Your Price IDs

After creating each product, you'll see a Price ID that looks like:
- `price_1ABC123test_starter`
- `price_1DEF456test_pro`
- `price_1GHI789test_enterprise`

## Step 4: Share the Price IDs

Once you have all 3 Price IDs, share them with me and I'll update the code to use your actual Stripe products!

## Test Payment Details (for testing later)

When testing payments, use these test card details:
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

## Your Current Keys (already configured)
- **Publishable Key**: `pk_test_51RfY8L4Fdg6FLS0ShOSrboNFOl64dIugx1hNbiVi2GdKffs1RkC4z4eHVCBJvlTsVCSWEz8LFVPWG26ZsVwuOahT001XX9mMAO`
- **Secret Key**: `sk_test_51•••••LGZ` (hidden for security)