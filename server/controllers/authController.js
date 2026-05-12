import supabase from '../config/supabase.js';

// Backend-handled signup - uses service_role key
export const signupUser = async (req, res) => {
  const { name, fullName, email, password, adminKey, phone } = req.body;
  const resolvedName = fullName || name;

  if (!email || !password || !resolvedName) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so they can login immediately
      user_metadata: { full_name: resolvedName }
    });

    if (authError) {
      // Check for duplicate
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        return res.status(409).json({ message: 'An account with this email already exists. Please login instead.' });
      }
      throw authError;
    }

    const user = authData.user;
    console.log(`Supabase Auth user created: ${email} (${user.id})`);

    // The database trigger will auto-create the profile, but let's ensure it exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Check if promoting to admin
    const ADMIN_SECRET = 'SERVICEPOINT_ADMIN_2024';
    const finalRole = (adminKey === ADMIN_SECRET) ? 'admin' : 'user';

    if (!profile) {
      // Trigger didn't fire or table didn't exist yet - create manually
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: resolvedName,
        phone: phone || null,
        role: finalRole
      });
    } else if (finalRole === 'admin' && profile.role !== 'admin') {
      // Update existing profile to admin
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    }

    // Now sign them in to get a session token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) throw signInError;

    const token = signInData.session.access_token;
    const refreshToken = signInData.session.refresh_token;

    // Get the profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.status(201).json({
      ...userProfile,
      token,
      refreshToken,
      lastLogin: new Date().toISOString()
    });
  } catch (error) {
    console.error('Signup Controller Error:', error);
    res.status(500).json({ message: 'Registration failure', error: error.message });
  }
};

// Backend-handled login - uses service_role key to verify
export const loginUser = async (req, res) => {
  const { email, password, adminKey } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        return res.status(401).json({ message: 'Invalid email or password. Please verify your credentials.' });
      }
      throw signInError;
    }

    const user = signInData.user;
    const token = signInData.session.access_token;
    const refreshToken = signInData.session.refresh_token;

    console.log(`Login successful: ${email} (${user.id})`);

    // Get/create profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Operative',
          role: 'user'
        })
        .select()
        .single();
      profile = newProfile;
    }

    // Admin promotion
    const ADMIN_SECRET = 'SERVICEPOINT_ADMIN_2024';
    if (adminKey === ADMIN_SECRET && profile.role !== 'admin') {
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()
        .single();
      profile = updatedProfile;
    }

    res.json({
      ...profile,
      token,
      refreshToken,
      lastLogin: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login Controller Error:', error);
    res.status(500).json({ message: 'Authentication failure', error: error.message });
  }
};

// Token verification (for protected page loads)
export const verifyUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Identity context lost.' });
    }

    const { adminKey } = req.body;
    const ADMIN_SECRET = 'SERVICEPOINT_ADMIN_2024';
    
    if (adminKey === ADMIN_SECRET && req.user.role !== 'admin') {
      const { data: updatedUser, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', req.user.id)
        .select()
        .single();
      
      if (error) throw error;
      req.user = updatedUser;
    }

    res.json(req.user);
  } catch (error) {
    console.error('VerifyUser Controller Error:', error);
    res.status(500).json({ 
      message: 'Verification failure', 
      error: error.message
    });
  }
};

export const registerUser = async (req, res) => {
  // Redirect to signupUser for backward compat
  return signupUser(req, res);
};

export const updateProfile = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name || req.body.full_name) updateData.full_name = req.body.full_name || req.body.name;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.notificationPreferences) {
      const { data: current } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', req.user.id)
        .single();
      
      updateData.notification_preferences = {
        ...(current?.notification_preferences || {}),
        ...req.body.notificationPreferences
      };
    }

    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
