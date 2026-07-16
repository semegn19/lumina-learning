// ─────────────────────────────────────────────
//  Backend API — TypeScript Type Definitions
//  Base URL: http://localhost:8000      
// ─────────────────────────────────────────────

// ── Shared ──────────────────────────────────

export interface PaginationMeta {
  page: number;
  size: number;
  total_items: number;
  page_items: number;
  total_pages: number;
}

/** Standard DRF paginated list response with optional meta */
export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  meta?: PaginationMeta;
  results: T[];
}

// ── Auth ────────────────────────────────────

export type UserRole = "MA" | "SA" | "ST"; // Master Admin | Secondary Admin | Student

/** The user object embedded in login / profile responses */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name?: string | undefined;
  last_name?: string | undefined;
  role?: UserRole | string | undefined;
  is_staff?: boolean | undefined;
  is_superuser?: boolean | undefined;
  is_active?: boolean | undefined;
  date_joined?: string | undefined;
  profile_picture?: string | null | undefined;
  avatar?: string | null | undefined;
  phone?: string | null | undefined;
  phone_number?: string | null | undefined;
  contact_phone?: string | null | undefined;
  location?: string | null | undefined;
  address?: string | null | undefined;
  full_address?: string | null | undefined;
  contact_address?: string | null | undefined;
  bio?: string | null | undefined;
  experience?: string | null | undefined;
  skills?: string[] | string | undefined;
}

/** POST /api/login/ response */
export interface LoginResponse {
  access: string;
  refresh: string;
}

/** POST /api/register/ request body */
export interface RegisterPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password2: string;
}

/** POST /api/register/ response */
export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

/** POST /api/token/refresh/ response */
export interface TokenRefreshResponse {
  access: string;
}

// ── Courses ─────────────────────────────────

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "B" | "I" | "A";
export type CourseCurrency = "USD" | "EUR" | "GBP" | "NGN";

export interface Course {
  id: number;
  title: string;
  description: string;
  price: string;
  currency: CourseCurrency;
  level: CourseLevel;
  topics_covered?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  thumbnail?: string | null;
  lesson_count?: number;
  student_count?: number;
}

export interface CourseCreatePayload {
  title: string;
  description: string;
  price: number;
  currency: CourseCurrency;
  level: "Beginner" | "Intermediate" | "Advanced";
  topics_covered?: string | undefined;
  thumbnail?: File | string | null | undefined;
}

// ── Lessons ─────────────────────────────────

export interface Lesson {
  id: number;
  course: number;
  title: string;
  description: string;
  order: number;
  video_file?: string | null;
  pdf_resource?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonCreatePayload {
  title: string;
  description: string;
  order: number;
  video_file?: File | null | undefined;
  pdf_resource?: File | null | undefined;
}

// ── Enrollments ─────────────────────────────

export type EnrollmentStatus = "P" | "A" | "C"; // Pending | Active | Completed

export interface LessonProgress {
  id: number;
  enrollment?: number | { id: number } | undefined;
  lesson?: number | { id: number; title?: string } | undefined;
  lesson_title?: string | undefined;
  is_completed: boolean;
  completed_at?: string | null | undefined;
}

export interface Enrollment {
  id: number;
  user: number;
  user_name?: string;
  course: number | { id: number; title?: string };
  course_title?: string;
  status: EnrollmentStatus;
  progress: number | string;
  enrolled_at: string;
  updated_at?: string;
  lesson_progress?: LessonProgress[] | undefined;
  progress_records?: LessonProgress[] | undefined;
  lessons_progress?: LessonProgress[] | undefined;
}

export interface EnrollmentCreatePayload {
  course: number;
}

// ── Payments ────────────────────────────────

export type PaymentProvider = "PS" | "FW" | "ST"; // Paystack | Flutterwave | Stripe

export interface PaymentInitPayload {
  provider: PaymentProvider;
  course_id?: number | undefined;
  event_id?: number | undefined;
  event?: number | undefined;
  amount: string;
  currency?: CourseCurrency | string | undefined;
  promo_code?: string | undefined;
}

export interface PaymentInitResponse {
  checkout_url: string;
  reference: string;
  provider?: PaymentProvider | undefined;
  payment_url?: string | undefined;
  url?: string | undefined;
  amount_charged?: string | number | undefined;
  discount_applied?: {
    code: string;
    percentage: number;
    original_price: string | number;
  } | undefined;
}

export interface PaymentVerifyPayload {
  provider: PaymentProvider;
  reference: string;
  session_id?: string; // Stripe only
}

// ── Donations ───────────────────────────────

export interface DonationInitPayload {
  provider: PaymentProvider;
  amount: string;
  currency: CourseCurrency;
  purpose: string;
}

export interface DonationInitResponse {
  checkout_url: string;
  reference: string;
  provider: PaymentProvider;
}

// ── Certificates ────────────────────────────

export interface Certificate {
  id: number;
  certificate_id?: string;
  uuid?: string;
  user: number | { id: number; username: string; first_name?: string; last_name?: string };
  user_name?: string;
  course: number | { id: number; title: string };
  course_title?: string;
  issued_at: string;
  pdf_file?: string | null;
  pdf_url?: string | null;
}

/** GET /api/verify/{uuid}/ response */
export interface CertificateVerification {
  id?: number;
  certificate_id?: string;
  uuid?: string;
  user?: number | { id: number; username: string; first_name?: string; last_name?: string };
  user_name?: string;
  course?: number | { id: number; title: string };
  course_title?: string;
  issued_at: string;
  pdf_file?: string | null;
  pdf_url?: string | null;
  is_valid?: boolean;
}

// ── Users (Admin) ────────────────────────────

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  profile_picture?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  experience?: string | null;
  skills?: string[];
}

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  experience?: string;
  skills?: string[];
  profile_picture?: File | null;
}

// ── Audit Logs (Admin) ───────────────────────

export interface AuditLogUserObject {
  id?: number | undefined;
  username?: string | undefined;
  email?: string | undefined;
  first_name?: string | undefined;
  last_name?: string | undefined;
  profile_picture?: string | null | undefined;
}

export interface AuditLog {
  id?: number | string | undefined;
  user?: number | string | AuditLogUserObject | null | undefined;
  user_name?: string | undefined;
  user_email?: string | undefined;
  action: string;
  tag?: string | undefined;
  details?: string | Record<string, unknown> | undefined;
  created?: string | undefined;
  created_at?: string | undefined;
  timestamp?: string | undefined;
  ip_address?: string | undefined;
  ip?: string | undefined;
}

// ── Events ───────────────────────────────────

export interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  place: string;
  price: number | string;
  currency: string;
  featured_guest?: string | undefined;
  created_by?: number | string | { id: number; first_name?: string; last_name?: string; profile_picture?: string } | undefined;
  user?: number | string | { id: number; first_name?: string; last_name?: string; profile_picture?: string } | undefined;
  image?: string | null | undefined;
  is_registered?: boolean | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface EventCreatePayload {
  title: string;
  description: string;
  date: string;
  place: string;
  price: number | string;
  currency: string;
  featured_guest?: string | undefined;
  image?: File | null | undefined;
}

export interface EventRegistration {
  id: number;
  event?: number | EventItem | undefined;
  event_id?: number | undefined;
  event_title?: string | undefined;
  user?: number | AuthUser | { id: number; first_name?: string; last_name?: string; email?: string; phone_number?: string; profile_picture?: string } | undefined;
  user_name?: string | undefined;
  user_email?: string | undefined;
  status: "S" | "P" | string;
  amount?: string | number | undefined;
  currency?: string | undefined;
  reference?: string | undefined;
  message?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

// ── Jobs & Applications ──────────────────────

export interface JobItem {
  id: number;
  title: string;
  description: string;
  company?: string | undefined;
  location?: string | undefined;
  deadline?: string | null | undefined;
  status?: "open" | "closed" | "O" | "C" | string | undefined;
  type?: string | undefined;
  salary?: number | string | undefined;
  requirements?: string[] | string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  applications_count?: number | undefined;
}

export interface JobCreatePayload {
  title: string;
  description?: string | undefined;
  company?: string | undefined;
  location?: string | undefined;
  deadline?: string | undefined;
  status?: string | undefined;
  type?: string | undefined;
  salary?: number | string | undefined;
  requirements?: string[] | undefined;
}

export interface DiscountCourseDetail {
  id: number;
  title: string;
  price?: string | number | undefined;
  currency?: string | undefined;
}

export interface DiscountItem {
  id: number;
  title: string;
  code: string;
  percentage?: number | undefined;
  discount_percentage?: number | undefined;
  start_date?: string | null | undefined;
  end_date?: string | null | undefined;
  description?: string | undefined;
  courses?: number[] | undefined;
  course_details?: DiscountCourseDetail[] | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface DiscountCreatePayload {
  title: string;
  code: string;
  percentage: number;
  discount_percentage?: number | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  description?: string | undefined;
  courses?: number[] | undefined;
}

export interface ValidateDiscountResponse {
  valid: boolean;
  code?: string | undefined;
  percentage?: number | undefined;
  original_price?: string | number | undefined;
  discounted_price?: string | number | undefined;
  currency?: string | undefined;
  expires?: string | undefined;
  error?: string | undefined;
  detail?: string | undefined;
}

export interface OrganizationSettings {
  id?: number | undefined;
  name?: string | undefined;
  organization_name?: string | undefined;
  tagline?: string | undefined;
  title?: string | undefined;
  logo?: string | null | undefined;
  website_url?: string | undefined;
  website?: string | undefined;
  founded_year?: string | number | undefined;
  location?: string | undefined;
  base_location?: string | undefined;
  description?: string | undefined;
  short_description?: string | undefined;
  mission?: string | undefined;
  mission_statement?: string | undefined;
  vision?: string | undefined;
  vision_statement?: string | undefined;
  core_values?: string | undefined;
  contact_email?: string | undefined;
  support_email?: string | undefined;
  contact_phone?: string | undefined;
  phone_number?: string | undefined;
  full_address?: string | undefined;
  contact_address?: string | undefined;
  address?: string | undefined;
  twitter?: string | undefined;
  twitter_url?: string | undefined;
  facebook?: string | undefined;
  facebook_url?: string | undefined;
  linkedin?: string | undefined;
  linkedin_url?: string | undefined;
  instagram?: string | undefined;
  instagram_url?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface JobApplication {
  id: number;
  job: number | JobItem;
  job_detail?: JobItem | undefined;
  user?: number | { id: number; first_name?: string; last_name?: string; email?: string; profile_picture?: string } | undefined;
  cover_letter?: string | undefined;
  status?: string | undefined;
  created_at?: string | undefined;
  applied_at?: string | undefined;
}

export interface JobApplicationCreatePayload {
  job: number;
  cover_letter?: string | undefined;
}

// ── API Error ────────────────────────────────

/** Shape of a DRF validation error response */
export interface ApiError {
  detail?: string;
  [field: string]: string | string[] | undefined;
}

// ── Admin Dashboard ─────────────────────────

export interface AdminDashboardStats {
  total_users?: number | string | undefined;
  active_users?: number | string | undefined;
  total_enrollments?: number | string | undefined;
  total_revenue?: number | string | undefined;
}

export interface AdminDashboardRevenueBreakdown {
  paid_courses?: number | string | undefined;
  free_courses?: number | string | undefined;
  donations?: number | string | undefined;
}

export interface AdminDashboardUserGrowthPoint {
  month?: string | undefined;
  date?: string | undefined;
  count?: number | undefined;
  users?: number | undefined;
}

export interface AdminDashboardData {
  stats?: AdminDashboardStats | undefined;
  total_users?: number | string | undefined;
  active_users?: number | string | undefined;
  total_enrollments?: number | string | undefined;
  total_revenue?: number | string | undefined;
  currency?: string | undefined;

  revenue_breakdown?: AdminDashboardRevenueBreakdown | undefined;
  revenue_by_source?: AdminDashboardRevenueBreakdown | undefined;
  paid_courses_revenue?: number | string | undefined;
  donations_revenue?: number | string | undefined;

  user_growth?: AdminDashboardUserGrowthPoint[] | undefined;

  recent_activities?: AuditLog[] | undefined;
  recent_activity?: AuditLog[] | undefined;
  audit_logs?: AuditLog[] | undefined;
  recent_logs?: AuditLog[] | undefined;
  [key: string]: unknown;
}

// ── Bot Knowledge Base & Logs ───────────────

export interface BotFaq {
  id: number;
  question: string;
  answer: string;
  category?: string | undefined;
  is_active?: boolean | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  created?: string | undefined;
}

export interface BotFaqCreatePayload {
  question: string;
  answer: string;
  category?: string | undefined;
}

export interface BotLog {
  id?: number | string | undefined;
  user?: number | string | AuthUser | { id?: number; username?: string; email?: string; first_name?: string; last_name?: string; profile_picture?: string } | null | undefined;
  user_id?: number | string | undefined;
  user_name?: string | undefined;
  user_email?: string | undefined;
  question?: string | undefined;
  user_message?: string | undefined;
  message?: string | undefined;
  response?: string | undefined;
  bot_response?: string | undefined;
  reply?: string | undefined;
  answer?: string | undefined;
  platform?: string | undefined;
  channel?: string | undefined;
  session_id?: string | undefined;
  ip_address?: string | undefined;
  ip?: string | undefined;
  created_at?: string | undefined;
  timestamp?: string | undefined;
  created?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  [key: string]: unknown;
}

