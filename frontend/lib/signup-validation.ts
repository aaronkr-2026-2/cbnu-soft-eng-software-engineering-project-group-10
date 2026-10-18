export type SignupFields = {
  full_name: string;
  student_number: string;
  email: string;
  password: string;
  agree: boolean;
};

export type SignupErrors = Partial<Record<keyof SignupFields, string>>;

// Match the existing POST /auth/register contract. Do not trim passwords.
export function validateSignup(fields: SignupFields): SignupErrors {
  const errors: SignupErrors = {};
  const name = fields.full_name.trim();
  const studentNumber = fields.student_number.trim();
  const email = fields.email.trim();
  if (!name) errors.full_name = 'Enter your full name.';
  else if (name.length > 100) errors.full_name = 'Full name must be 100 characters or fewer.';
  if (!studentNumber) errors.student_number = 'Enter your student number.';
  else if (studentNumber.length > 50) errors.student_number = 'Student number must be 50 characters or fewer.';
  if (!email) errors.email = 'Enter your email address.';
  else if (email.length > 254) errors.email = 'Email must be 254 characters or fewer.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!fields.password) errors.password = 'Enter a password.';
  else if (fields.password.length < 12 || fields.password.length > 128) errors.password = 'Password must be 12-128 characters.';
  if (!fields.agree) errors.agree = 'Please confirm that you will use CampusFind responsibly.';
  return errors;
}
