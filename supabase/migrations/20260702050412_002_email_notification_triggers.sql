-- Add email notification triggers for signup and idea submission

-- Function to queue welcome email on user signup
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    -- Insert into email_queue for the new user
    INSERT INTO email_queue (to_user_id, to_email, subject, body, status, reference_id)
    VALUES (
      NEW.id,
      NEW.email,
      'Welcome to TSDPL BI Dashboard',
      'Dear ' || COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)) || ',<br><br>Welcome to TSDPL BI Corporate Workflow Dashboard! Your account has been successfully created.<br><br>You can now submit ideas, track project workflows, and collaborate with your team.<br><br>Best regards,<br>TSDPL BI Team',
      'pending',
      'registration:user:' || NEW.id
    );

    -- Also create an in-app notification for the new user
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'Welcome to TSDPL BI!',
      'Your account has been successfully created. Start by submitting your first idea!',
      'success'
    );

    -- Notify and email admin users about the new registration
    INSERT INTO email_queue (to_user_id, to_email, subject, body, status, reference_id)
    SELECT
      p.id,
      p.email,
      'New User Registered - TSDPL BI',
      'A new user has registered:<br><br><strong>Name:</strong> ' || COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)) || '<br><strong>Email:</strong> ' || NEW.email || '<br><strong>User ID:</strong> ' || NEW.id || '<br><strong>Registered at:</strong> ' || now() || '<br><br>Review the user in the admin dashboard.',
      'pending',
      'registration:admin:' || NEW.id || ':' || p.email
    FROM profiles p
    WHERE p.role = 'admin';

    INSERT INTO notifications (user_id, title, message, type)
    SELECT
      id,
      'New user registered',
      'A new user has signed up: ' || COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)) || ' (' || NEW.email || ')',
      'new_registration'
    FROM profiles
    WHERE role = 'admin';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'send_welcome_email suppressed error: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Trigger on profile creation (after user signup)
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION send_welcome_email();

-- Ensure the welcome email trigger function runs with an owner that can bypass RLS
ALTER FUNCTION public.send_welcome_email() OWNER TO postgres;

-- Function to queue email on idea submission
CREATE OR REPLACE FUNCTION send_idea_submission_email()
RETURNS TRIGGER AS $$
DECLARE
  submitter_email TEXT;
  submitter_name TEXT;
BEGIN
  -- Get submitter details
  SELECT email, full_name INTO submitter_email, submitter_name
  FROM profiles WHERE id = NEW.submitter_id;
  
  -- Create in-app notification for submitter
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.submitter_id,
    'Idea Submitted!',
    'Your idea "' || NEW.project_name || '" has been submitted successfully.',
    'success'
  );
  
  -- Send confirmation email to submitter
  INSERT INTO email_queue (to_user_id, to_email, subject, body, status, reference_id)
  SELECT
    id,
    email,
    'Your idea has been submitted - TSDPL BI Portal',
    'Dear ' || COALESCE(full_name, 'User') || ',<br><br>Thank you for submitting your idea!<br><br><strong>Idea Title:</strong> ' || NEW.project_name || '<br><strong>Description:</strong> ' || COALESCE(NEW.description, 'No description provided') || '<br><strong>Submission Date & Time:</strong> ' || now() || '<br><strong>Status:</strong> Submitted Successfully<br><br>Best regards,<br>TSDPL BI Team',
    'pending',
    'idea:user:' || NEW.id
  FROM profiles
  WHERE id = NEW.submitter_id;

  -- Notify all admins and reviewers
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    id,
    'New Idea Submitted',
    'A new idea "' || NEW.project_name || '" has been submitted for review.',
    'info'
  FROM profiles
  WHERE role IN ('admin', 'reviewer') AND id != NEW.submitter_id;
  
  -- Send emails to admins and reviewers
  INSERT INTO email_queue (to_user_id, to_email, subject, body, status, reference_id)
  SELECT 
    id,
    email,
    'New Idea Requires Review - ' || NEW.project_name,
    'Dear ' || COALESCE(full_name, 'User') || ',<br><br>A new idea has been submitted and requires your review.<br><br><strong>Idea Title:</strong> ' || NEW.project_name || '<br><strong>Description:</strong> ' || COALESCE(NEW.description, 'No description provided') || '<br><strong>Submitted by:</strong> ' || COALESCE(submitter_name, 'A user') || '<br><strong>Submission Date & Time:</strong> ' || now() || '<br><br>Please review it in the TSDPL BI Dashboard.<br><br>Best regards,<br>TSDPL BI Team',
    'pending',
    'idea:admin:' || NEW.id || ':' || email
  FROM profiles
  WHERE role IN ('admin', 'reviewer') AND id != NEW.submitter_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_idea_created ON ideas;
CREATE TRIGGER on_idea_created
  AFTER INSERT ON ideas
  FOR EACH ROW EXECUTE FUNCTION send_idea_submission_email();

-- Ensure the idea submission trigger function runs with an owner that can bypass RLS
ALTER FUNCTION public.send_idea_submission_email() OWNER TO postgres;