-- BTC Tracker Initial Database Schema
-- This schema matches the OptimizedTransaction interface exactly for zero-transformation operations

-- Enable UUID extension for generating user IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transactions table with exact OptimizedTransaction structure
CREATE TABLE public.transactions (
    -- Primary fields (required)
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    exchange TEXT NOT NULL,
    type TEXT NOT NULL,
    usd_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    btc_amount DECIMAL(16,8) NOT NULL,
    price DECIMAL(12,2) NOT NULL,

    -- Extended fields (optional for backward compatibility)
    destination_wallet TEXT,
    network_fee DECIMAL(16,8),
    network_fee_usd DECIMAL(12,2),
    is_self_custody BOOLEAN,
    notes TEXT,

    -- Classification fields for enhanced transaction types
    counterparty TEXT,
    goods_services TEXT,
    source_exchange TEXT,
    destination_exchange TEXT,

    -- Tax treatment flags
    is_taxable BOOLEAN,

    -- Metadata (required for database)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints for data integrity
    CONSTRAINT valid_amounts CHECK (
        usd_amount >= 0 AND 
        btc_amount != 0 AND 
        price >= 0
    ),
    CONSTRAINT valid_network_fees CHECK (
        network_fee IS NULL OR network_fee >= 0
    ),
    CONSTRAINT valid_dates CHECK (
        date <= NOW() AND 
        created_at <= updated_at
    )
);

-- Create indexes for optimal query performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_exchange ON public.transactions(exchange);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_exchange ON public.transactions(user_id, exchange);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to transactions table
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own transactions
CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own transactions
CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own transactions
CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.transactions TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.transactions IS 'Bitcoin transaction records with comprehensive tax tracking capabilities';
COMMENT ON COLUMN public.transactions.id IS 'Stable transaction ID generated from transaction data hash';
COMMENT ON COLUMN public.transactions.user_id IS 'Reference to authenticated user, NULL for anonymous users';
COMMENT ON COLUMN public.transactions.date IS 'Transaction timestamp in ISO 8601 format';
COMMENT ON COLUMN public.transactions.usd_amount IS 'USD amount involved in transaction (0 for withdrawals)';
COMMENT ON COLUMN public.transactions.btc_amount IS 'Bitcoin amount (positive for acquisitions, negative for disposals)';
COMMENT ON COLUMN public.transactions.price IS 'Bitcoin price at time of transaction in USD';
COMMENT ON COLUMN public.transactions.is_self_custody IS 'Flag indicating movement to self-custody wallet';
COMMENT ON COLUMN public.transactions.is_taxable IS 'Whether this transaction creates a taxable event';