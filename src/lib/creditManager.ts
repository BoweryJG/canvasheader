import { supabase } from '../auth/supabase';

export interface CreditCheckResult {
  hasCredits: boolean;
  creditsRemaining: number;
  error?: string;
}

export async function checkUserCredits(userId: string): Promise<CreditCheckResult> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('credits_remaining, subscription_tier')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking credits:', error);
      return { hasCredits: false, creditsRemaining: 0, error: error.message };
    }

    if (!profile) {
      return { hasCredits: false, creditsRemaining: 0, error: 'Profile not found' };
    }

    return {
      hasCredits: profile.credits_remaining > 0,
      creditsRemaining: profile.credits_remaining
    };
  } catch (error) {
    console.error('Error in checkUserCredits:', error);
    return { hasCredits: false, creditsRemaining: 0, error: 'Failed to check credits' };
  }
}

export async function deductCredit(userId: string): Promise<boolean> {
  try {
    // First check current credits
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (fetchError || !profile || profile.credits_remaining <= 0) {
      return false;
    }

    // Deduct one credit
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        credits_remaining: profile.credits_remaining - 1,
        last_scan_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error deducting credit:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deductCredit:', error);
    return false;
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      return 0;
    }

    return profile.credits_remaining || 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    return 0;
  }
}

export async function addCredits(userId: string, credits: number): Promise<boolean> {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (fetchError || !profile) {
      return false;
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        credits_remaining: (profile.credits_remaining || 0) + credits
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error adding credits:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addCredits:', error);
    return false;
  }
}