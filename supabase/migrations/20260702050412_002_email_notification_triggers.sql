-- Add email notification triggers for signup and idea submission

-- Function to queue welcome email on user signup
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into email_queue
  INSERT INTO email_queue (to_email, subject, body)
  VALUES (
    NEW.email,
    'Welcome to TSDPL BI Dashboard',
    'Dear ' || COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)) || ',<br><br>Welcome to TSDPL BI Corporate Workflow Dashboard! Your account has been successfully created.<br><br>You can now submit ideas, track project workflows, and collaborate with your team.<br><br>Best regards,<br>TSDPL BI Team'
  );
  
  -- Also create an in-app notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to TSDPL BI!',
    'Your account has been successfully created. Start by submitting your first idea!',
    'success'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profile creation (after user signup)
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION send_welcome_email();

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
  
  -- Insert into email_queue for submitter
  INSERT INTO email_queue (to_email, subject, body)
  VALUES (
    submitter_email,
    'Idea Submitted Successfully - ' || NEW.project_name,
    'Dear ' || COALESCE(submitter_name, 'User') || ',<br><br>Your idea "' || NEW.project_name || '" has been successfully submitted!<br><br>Project ID: ' || NEW.project_id || '<br>Status: ' || NEW.status || '<br><br>You will be notified as your idea progresses through the workflow stages.<br><br>Best regards,<br>TSDPL BI Team'
  );
  
  -- Create in-app notification for submitter
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.submitter_id,
    'Idea Submitted!',
    'Your idea "' || NEW.project_name || '" has been submitted successfully.',
    'success'
  );
  
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
  INSERT INTO email_queue (to_email, subject, body)
  SELECT 
    email,
    'New Idea Requires Review - ' || NEW.project_name,
    'Dear ' || COALESCE(full_name, 'User') || ',<br><br>A new idea has been submitted and requires your review.<br><br>Project: ' || NEW.project_name || '<br>Submitted by: ' || COALESCE(submitter_name, 'A user') || '<br><br>Please review it in the TSDPL BI Dashboard.<br><br>Best regards,<br>TSDPL BI Team'
  FROM profiles
  WHERE role IN ('admin', 'reviewer') AND id != NEW.submitter_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on idea creation
DROP TRIGGER IF EXISTS on_idea_created ON ideas;
CREATE TRIGGER on_idea_created
  AFTER INSERT ON ideas
  FOR EACH ROW EXECUTE FUNCTION send_idea_submission_email();