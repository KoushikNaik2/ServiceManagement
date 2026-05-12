import supabase from '../config/supabase.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token with Supabase Auth
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !supabaseUser) {
        throw new Error(authError?.message || 'Invalid token');
      }

      console.log(`Auth request for: ${supabaseUser.email} (${supabaseUser.id})`);
      
      // Get profile from Supabase Database
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') { // PGRST116 is "No rows found"
        console.log(`Profile not found, creating new profile for: ${supabaseUser.email}`);
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || 'Operative',
            role: 'user'
          })
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      } else if (profileError) {
        throw profileError;
      }

      // Attach user profile to request
      req.user = profile;
      next();
    } catch (error) {
      console.error('CRITICAL Auth Error:', error.message);
      res.status(401).json({ 
        message: 'Authorization failed', 
        error: error.message,
        hint: 'Check if Supabase configuration is valid and reachable'
      });
    }
  } else {
    console.warn('Auth request blocked: No Bearer token');
    res.status(401).json({ message: 'No authorization token' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Admin clearance required' });
  }
};
