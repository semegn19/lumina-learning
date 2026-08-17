import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {  
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Facebook,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Star,
  Twitter,
} from "lucide-react";
import { useState } from "react";

import bannerStudent from "@/assets/banner-student.jpg";
import courseTypography from "@/assets/course-typography.jpg";
import courseUx from "@/assets/course-ux.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Course, EventItem, JobItem } from "@/lib/api-types";
import { useAuth, isAdmin } from "@/lib/auth-context";
import { getCourses } from "@/lib/courses-api";
import { getEvents } from "@/lib/events-api";
import { getJobs } from "@/lib/jobs-api";
import { getOrganizationSettings } from "@/lib/organization-api";
import { formatPrice, formatJobSalary, getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Lumina Learning — Shape Your Future with the Right Knowledge" },
      {
        name: "description",
        content:
          "Cutting-edge online courses in design, development and marketing. Learn from industry professionals and grow your career with Lumina Learning.",
      },
      { property: "og:title", content: "Shape Your Future with the Right Knowledge" },
      { property: "og:description", content: "Cutting-edge online courses taught by industry professionals." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/landing" }],
  }),
  component: Landing,
});

const stats = [
  { value: "100%", label: "Satisfaction rate" },
  { value: "12+", label: "Years of experience" },
  { value: "20k+", label: "Total Courses" },
  { value: "90+", label: "Course Category" },
];

const fallbackCourses: Array<{ id: number; title: string; blurb: string; image: string; price: string }> = [
  {
    id: 1,
    title: "Become a Certified Web Developer: HTML, CSS and JavaScript",
    blurb: "Master the fundamentals of modern web development with hands-on projects and expert guidance.",
    image: courseUx,
    price: "Free",
  },
  {
    id: 2,
    title: "A Digital Marketing (DMSI) Method With Communication",
    blurb: "Learn to create high-impact marketing strategies that drive engagement and disciplined growth.",
    image: courseTypography,
    price: "$49.99",
  },
  {
    id: 3,
    title: "Advance Figma Prototyping For UI/UX Designer",
    blurb: "Deep dive into advanced Figma techniques to build beautiful and professional smart interfaces.",
    image: bannerStudent,
    price: "$79.99",
  },
];

const fallbackEvents = [
  {
    id: 1,
    title: "Global EdTech & AI Innovation Summit 2026",
    description: "Explore the future of digital learning, adaptive curricula, and AI tools for educators and students.",
    date: "2026-09-15T14:00:00Z",
    place: "Virtual / Zoom Live",
    price: "Free",
    image: bannerStudent,
  },
  {
    id: 2,
    title: "Mastering Design Systems & Micro-Interactions",
    description: "Hands-on masterclass focusing on building scalable design tokens, component architecture, and Figma workflows.",
    date: "2026-09-22T16:00:00Z",
    place: "Online Webinar",
    price: "GH₵29.00",
    image: courseUx,
  },
  {
    id: 3,
    title: "Full-Stack Development Career Roadmap",
    description: "Live Q&A and portfolio teardown session with senior engineering managers from top tech companies.",
    date: "2026-10-05T18:00:00Z",
    place: "Live Stream",
    price: "Free",
    image: courseTypography,
  },
];

const fallbackJobs = [
  {
    id: 1,
    title: "Senior Product Designer",
    company: "Lumina Labs",
    location: "Remote · Full-Time",
    salary: "$110k - $140k",
    description: "Lead end-to-end UX/UI initiatives for our next-generation online learning platform and student tools.",
  },
  {
    id: 2,
    title: "Frontend Engineer (React & TypeScript)",
    company: "EduCraft Studio",
    location: "Hybrid · New York, NY",
    salary: "$95k - $125k",
    description: "Build fast, interactive web interfaces and real-time learning workflows using modern React and Vite.",
  },
  {
    id: 3,
    title: "Instructional Content Specialist",
    company: "Creative Academy",
    location: "Remote · Contract",
    salary: "$45 - $60 / hr",
    description: "Design and curate high-impact curricula for web development, product management, and digital strategy.",
  },
];

const features = [
  { title: "Personalized Learning Paths", body: "Get personalized course recommendations tailored to your goals." },
  { title: "Live Sessions & Webinars", body: "Engage directly with expert instructors in real time." },
  { title: "Student Dashboard", body: "Access all your enrolled courses, track progress, and earn certificates." },
  { title: "Community & Networking", body: "Connect with thousands of peers through events and discussions." },
];

const journey = [
  {
    value: "2 Million Learners",
    body: "With over 2 million learners worldwide, our platform has become a trusted resource for skill building.",
  },
  {
    value: "500k+ 5 Star Reviews",
    body: "With an outstanding 5-star rating across our platform, our learners consistently praise the course quality.",
  },
  {
    value: "40+ Global Awards",
    body: "Recognised internationally for excellence in online education, curriculum design, and learning impact.",
  },
];

const testimonials = [
  {
    quote: "This platform helped me land my dream job in data science. The courses were practical and easy to follow.",
    name: "John Matthews",
    role: "Product Manager",
  },
  {
    quote: "I never thought I could start a business, but the entrepreneurship course gave me the confidence and tools.",
    name: "Sarah Lee",
    role: "Product Designer",
  },
  {
    quote: "The flexibility of the courses allowed me to learn at my own pace while managing my job. Highly recommended!",
    name: "Michael Davis",
    role: "Engineering Lead",
  },
];

const faqs = [
  {
    q: "What types of courses do you offer?",
    a: "We offer courses across design, development, marketing, data, and business — from beginner foundations to advanced masterclasses.",
  },
  {
    q: "What are the system requirements to take a course?",
    a: "All you need is a computer or mobile device with internet access, a modern browser (Chrome, Firefox, Safari, Edge), and a willingness to learn.",
  },
  {
    q: "How can I enroll in a course?",
    a: "Create a free account, browse our course catalog, and click 'Enroll Course'. For paid courses, our secure checkout gives you instant access.",
  },
  {
    q: "Can I access the course materials after completing the course?",
    a: "Yes! You receive lifetime access to every course you enroll in, including all future curriculum updates and resources.",
  },
  {
    q: "Is there a refund policy if I'm not satisfied with a course?",
    a: "We offer a 30-day money-back guarantee on all paid courses, no questions asked.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState(1);
  const [footerEmail, setFooterEmail] = useState("");

  // 1. Fetch organization settings
  const { data: org } = useQuery({
    queryKey: ["organization-settings"],
    queryFn: getOrganizationSettings,
  });

  // 2. Fetch live courses from API
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses", "landing"],
    queryFn: async () => {
      const res = await getCourses({ page: 1 });
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  // 3. Fetch live events from API
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", "landing"],
    queryFn: async () => {
      const res = await getEvents({ page: 1 });
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  // 4. Fetch live jobs from API
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs", "landing"],
    queryFn: async () => {
      const res = await getJobs({ page: 1 });
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  const orgName = org?.organization_name || org?.name || "Serene Academy";
  const displayCourses: Course[] = coursesData && coursesData.length > 0 ? coursesData.slice(0, 6) : [];
  const displayEvents: EventItem[] = eventsData && eventsData.length > 0 ? eventsData.slice(0, 3) : [];
  const displayJobs: JobItem[] = jobsData && jobsData.length > 0 ? jobsData.slice(0, 3) : [];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void navigate({ to: "/auth/register" });
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Top Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3.5 md:px-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            {org?.logo ? (
              <img src={getMediaUrl(org.logo)} alt={orgName} className="size-8 rounded-lg object-cover" />
            ) : (
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-5" aria-hidden />
              </span>
            )}
            <span className="font-display text-lg font-bold tracking-tight text-foreground">{orgName}</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/courses" className="transition-colors hover:text-foreground">
              Courses
            </Link>
            <Link to="/events" className="transition-colors hover:text-foreground">
              Events
            </Link>
            <Link to="/jobs" className="transition-colors hover:text-foreground">
              Jobs
            </Link>
            <Link to="/discounts" className="transition-colors hover:text-foreground">
              Discounts
            </Link>
            <Link to="/organization" className="transition-colors hover:text-foreground">
              About
            </Link>
          </nav>

          {/* Authentication Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild className="rounded-full px-5 font-semibold">
                <Link to={isAdmin(user?.role as any) ? "/admin" : "/"}>Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-full px-4 text-sm font-semibold">
                  <Link to="/auth/login">Sign In</Link>
                </Button>
                <Button asChild className="rounded-full px-5 text-sm font-semibold">
                  <Link to="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────── */}
      <main>
        {/* Hero Section */}
        <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-12 lg:grid-cols-2 md:px-8">
          <div>
            <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-wide text-primary">
              #1 ONLINE COURSE 2026
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.08]">
              Shape Your Future with the Right Knowledge
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground">
              Discover a world of knowledge with our cutting-edge online courses. Empower yourself to succeed in your
              career, passions & personal growth journey.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button asChild className="rounded-full px-7 font-semibold">
                <Link to={isAuthenticated ? "/" : "/auth/register"}>GET STARTED</Link>
              </Button>
              <Link
                to={isAuthenticated ? "/" : "/auth/register"}
                aria-label="Get started"
                className="grid size-11 place-items-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
              >
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl bg-primary-soft shadow-sm">
              <img
                src={bannerStudent}
                alt="Student learning online"
                width={900}
                height={700}
                className="h-[380px] w-full object-cover"
              />
            </div>

            {/* Floating Promotion Card */}
            <Link
              to="/discounts"
              className="group absolute -bottom-4 left-4 block rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg transition-transform hover:scale-105"
            >
              <p className="text-[10px] font-bold tracking-wide opacity-80">SEASONAL SPECIAL</p>
              <p className="mt-1 text-sm font-semibold">Special Discounts</p>
              <p className="font-display text-2xl font-semibold tracking-tight text-primary-foreground sm:text-3xl">
                Up to 50% OFF
              </p>
              <p className="mt-1 text-[11px] opacity-85">Explore available offers →</p>
            </Link>

            <div className="absolute right-4 top-6 flex items-center gap-2 rounded-2xl border border-border/80 bg-card/95 px-4 py-3 text-xs font-bold text-foreground shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-primary/50 hover:bg-accent/40 cursor-pointer">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="size-3.5" aria-hidden />
              </span>
              <span>More than 500,000+ students</span>
            </div>
            <div className="absolute -right-2 bottom-16 flex items-center gap-2 rounded-2xl border border-border/80 bg-card/95 px-4 py-3 text-xs font-bold text-foreground shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-primary/50 hover:bg-accent/40 cursor-pointer">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                <BadgeCheck className="size-3.5 text-primary" aria-hidden />
              </span>
              <span>Best Industry Mentors</span>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="mx-auto mt-6 grid max-w-[1280px] gap-6 rounded-3xl border border-border bg-card px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── Courses Section (Dynamic from API) ──────────────── */}
        <section id="courses" className="mx-auto max-w-[1280px] px-6 py-20 text-center md:px-8">
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-wide text-primary">
            OUR COURSES
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Courses Designed for Success
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base text-muted-foreground">
            Start your journey with courses that build real-world skills and knowledge. Get access to high-quality
            learning taught by industry professionals.
          </p>

          {coursesLoading ? (
            <div className="mt-12 flex justify-center py-12">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : displayCourses.length > 0 ? (
            <div className="mt-12 grid gap-6 text-left md:grid-cols-2 lg:grid-cols-3">
              {displayCourses.map((c, i) => {
                const fallbackImg = i % 2 === 0 ? courseUx : courseTypography;
                const instructorName =
                  typeof c.created_by === "object" && c.created_by !== null
                    ? `${(c.created_by as any).first_name || ""} ${(c.created_by as any).last_name || ""}`.trim() ||
                      (c.created_by as any).username ||
                      "Instructor"
                    : "Instructor";

                const instructorAvatar =
                  typeof c.created_by === "object" && c.created_by !== null
                    ? getMediaUrl((c.created_by as any).profile_picture)
                    : undefined;

                return (
                  <article key={c.id} className="surface-card flex flex-col justify-between p-5 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
                    <div>
                      <Link to="/courses/$courseId" params={{ courseId: String(c.id) }} className="block overflow-hidden rounded-xl">
                        <img
                          src={getMediaUrl(c.thumbnail || (c as any).image) || fallbackImg}
                          alt={c.title}
                          loading="lazy"
                          width={800}
                          height={512}
                          className="h-44 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="rounded-md bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                          {c.level || "All Levels"}
                        </span>
                        <span className="font-semibold text-primary">{formatPrice(c.price, c.currency)}</span>
                      </div>

                      <Link to="/courses/$courseId" params={{ courseId: String(c.id) }}>
                        <h3 className="mt-3 line-clamp-2 text-base font-bold transition-colors group-hover:text-primary">
                          {c.title}
                        </h3>
                      </Link>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    </div>

                    <div className="mt-5 border-t border-border pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {instructorAvatar ? (
                            <img
                              src={instructorAvatar}
                              alt={instructorName}
                              className="size-7 rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <Avatar className="size-7 transition-transform duration-300 group-hover:scale-105">
                              <AvatarFallback className="text-[10px]">
                                {instructorName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs font-medium text-muted-foreground">{instructorName}</span>
                        </div>

                        <Button asChild size="sm" className="rounded-lg">
                          <Link to="/courses/$courseId" params={{ courseId: String(c.id) }}>
                            View Course
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-12 grid gap-6 text-left md:grid-cols-2 lg:grid-cols-3">
              {fallbackCourses.map((c) => (
                <article key={c.id} className="surface-card flex flex-col justify-between p-5 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
                  <div>
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={c.image}
                        alt={c.title}
                        loading="lazy"
                        width={800}
                        height={512}
                        className="h-44 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="rounded-md bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        All Levels
                      </span>
                      <span className="font-semibold text-primary">{c.price}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold transition-colors group-hover:text-primary">{c.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{c.blurb}</p>
                  </div>
                  <Button asChild variant="outline" className="mt-5 w-full rounded-lg text-primary">
                    <Link to="/courses">Enroll Course</Link>
                  </Button>
                </article>
              ))}
            </div>
          )}

          <Button asChild variant="outline" className="mt-10 rounded-full px-8 font-semibold">
            <Link to="/courses">EXPLORE ALL COURSES</Link>
          </Button>
        </section>

        {/* ── Events Section (Replaces Partners Section) ─────── */}
        <section id="events" className="mx-auto max-w-[1280px] px-6 py-20 text-center md:px-8 border-t border-border/60">
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-wide text-primary">
            LIVE EXPERIENCES
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Interactive Events & Masterclasses
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base text-muted-foreground">
            Join live workshops, virtual symposiums, and networking sessions led by recognized experts worldwide.
          </p>

          {eventsLoading ? (
            <div className="mt-12 flex justify-center py-12">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : displayEvents.length > 0 ? (
            <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
              {displayEvents.map((e, i) => {
                const eventImg = getMediaUrl(e.image) || (i % 2 === 0 ? bannerStudent : courseTypography);
                const priceText = formatPrice(e.price, e.currency);

                return (
                  <article key={e.id} className="surface-card flex flex-col justify-between p-5 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
                    <div>
                      <Link to="/events/$eventId" params={{ eventId: String(e.id) }} className="block overflow-hidden rounded-xl">
                        <img
                          src={eventImg}
                          alt={e.title}
                          loading="lazy"
                          width={800}
                          height={512}
                          className="h-44 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <Calendar className="size-3.5" aria-hidden />
                          {new Date(e.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="font-semibold text-primary">{priceText}</span>
                      </div>

                      <Link to="/events/$eventId" params={{ eventId: String(e.id) }}>
                        <h3 className="mt-3 line-clamp-2 text-base font-bold transition-colors group-hover:text-primary">
                          {e.title}
                        </h3>
                      </Link>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                    </div>

                    <div className="mt-5 border-t border-border pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground line-clamp-1">
                          <MapPin className="size-3.5 text-primary shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden />
                          {e.place || "Online"}
                        </span>
                        <Button asChild size="sm" className="rounded-lg">
                          <Link to="/events/$eventId" params={{ eventId: String(e.id) }}>
                            View Event
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
              {fallbackEvents.map((e) => (
                <article key={e.id} className="surface-card flex flex-col justify-between p-5 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
                  <div>
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={e.image}
                        alt={e.title}
                        loading="lazy"
                        width={800}
                        height={512}
                        className="h-44 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Calendar className="size-3.5" aria-hidden />
                        {new Date(e.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-semibold text-primary">{e.price}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold transition-colors group-hover:text-primary">{e.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>
                  </div>
                  <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 text-primary shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden />
                      {e.place}
                    </span>
                    <Button asChild size="sm" className="rounded-lg">
                      <Link to="/events">Join Event</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Button asChild variant="outline" className="mt-10 rounded-full px-8 font-semibold">
            <Link to="/events">EXPLORE MORE EVENTS</Link>
          </Button>
        </section>

        {/* Features Section */}
        <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 py-16 lg:grid-cols-2 md:px-8">
          <div className="relative">
            <img
              src={courseUx}
              alt="Learner on campus"
              loading="lazy"
              width={800}
              height={800}
              className="aspect-square w-full rounded-full object-cover"
            />
            <div className="absolute left-0 top-10 rounded-2xl bg-card p-4 shadow-md">
              <p className="text-[11px] text-muted-foreground">Course Completion</p>
              <p className="font-display text-lg font-bold text-success">↗ 94.8%</p>
              <p className="text-[11px] text-muted-foreground">Certified Rate</p>
            </div>
            <div className="absolute bottom-12 right-0 w-44 rounded-2xl bg-card p-4 shadow-md">
              <p className="text-[11px] text-muted-foreground">Active Learners</p>
              <p className="font-display text-2xl font-bold">12,500+</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div className="h-full w-[75%] rounded-full bg-primary" />
              </div>
            </div>
          </div>

          <div>
            <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-wide text-primary">
              OUR KEY FEATURES
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Powerful Features for Your Learning Journey
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              From personalized recommendations to interactive content, we've got everything you need to succeed.
            </p>
            <ul className="mt-8 space-y-6">
              {features.map((f) => (
                <li key={f.title} className="flex gap-4 border-b border-border pb-5 last:border-0">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Discover Jobs Section ───────────────────────────── */}
        <section id="jobs" className="mx-auto max-w-[1280px] px-6 py-20 text-center md:px-8 border-t border-border/60">
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-wide text-primary">
            CAREER OPPORTUNITIES
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Discover Jobs & Career Openings
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base text-muted-foreground">
            Connect directly with verified partners and companies hiring skilled talent across design, tech, and marketing.
          </p>

          {jobsLoading ? (
            <div className="mt-12 flex justify-center py-12">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : displayJobs.length > 0 ? (
            <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
              {displayJobs.map((j) => (
                <article key={j.id} className="surface-card flex flex-col justify-between p-6 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Building2 className="size-4 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden />
                        {j.company || "Hiring Partner"}
                      </span>
                      {j.salary && (
                        <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                          {formatJobSalary(j.salary)}
                        </span>
                      )}
                    </div>

                    <Link to="/jobs/$jobId" params={{ jobId: String(j.id) }}>
                      <h3 className="mt-3 text-lg font-bold transition-colors group-hover:text-primary">
                        {j.title}
                      </h3>
                    </Link>

                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{j.description}</p>
                  </div>

                  <div className="mt-6 border-t border-border pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 text-primary shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden />
                        {j.location || "Remote"}
                      </span>
                      <Button asChild size="sm" className="rounded-lg">
                        <Link to="/jobs/$jobId" params={{ jobId: String(j.id) }}>
                          View Role
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
              {fallbackJobs.map((j) => (
                <article key={j.id} className="surface-card flex flex-col justify-between p-6 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Building2 className="size-4 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden />
                        {j.company}
                      </span>
                      <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                        {formatJobSalary(j.salary)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold transition-colors group-hover:text-primary">{j.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{j.description}</p>
                  </div>
                  <div className="mt-6 border-t border-border pt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 text-primary shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden />
                      {j.location}
                    </span>
                    <Button asChild size="sm" className="rounded-lg">
                      <Link to="/jobs">Apply</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Button asChild variant="outline" className="mt-10 rounded-full px-8 font-semibold">
            <Link to="/jobs">EXPLORE ALL OPPORTUNITIES</Link>
          </Button>
        </section>

        {/* Journey & Impact Section */}
        <section className="mx-auto max-w-[1280px] px-6 py-16 text-center md:px-8">
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-wide text-primary">
            OUR SUCCESS
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Our Journey to Excellence
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base text-muted-foreground">
            At the core of our platform is a commitment to helping each student succeed. We take pride in the tangible
            results our learners achieve.
          </p>

          <div className="mt-12 grid gap-6 text-left lg:grid-cols-2">
            <ul className="surface-card divide-y divide-border p-8">
              {journey.map((j, i) => (
                <li key={j.value} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{j.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{j.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="surface-card flex flex-col justify-center p-8">
                <p className="text-sm text-muted-foreground">Our Community Scholarships</p>
                <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">$2.5M+</p>
                <p className="mt-8 font-display text-xl font-bold">300+</p>
                <p className="text-sm text-muted-foreground">Expert mentors around the globe</p>
              </div>
              <img
                src={courseTypography}
                alt="Mentor at work"
                loading="lazy"
                width={600}
                height={800}
                className="h-full w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-[1280px] px-6 py-16 text-center md:px-8">
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-wide text-primary">
            OUR TESTIMONIALS
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What Our Learners Are Saying
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base text-muted-foreground">
            Hear directly from our students about how our courses have transformed their careers and lives.
          </p>

          <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="surface-card flex flex-col justify-between p-7 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer"
              >
                <div>
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current transition-transform duration-300 group-hover:scale-110" aria-hidden />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm text-muted-foreground leading-relaxed">"{t.quote}"</blockquote>
                </div>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                  <Avatar className="size-10 transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={`https://i.pravatar.cc/80?u=${t.name}`} alt={t.name} />
                    <AvatarFallback>{t.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>
                    <span className="block text-sm font-semibold transition-colors group-hover:text-primary">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mx-auto max-w-[900px] px-6 py-16 text-center md:px-8">
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-wide text-primary">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your Questions, Answered
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base text-muted-foreground">
            Explore the answers to frequently asked questions about our platform and learning experience.
          </p>

          <ul className="mt-10 space-y-3.5 text-left">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <li
                  key={f.q}
                  onClick={() => setOpenFaq(isOpen ? -1 : i)}
                  className={`surface-card p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isOpen
                      ? "border-primary/50 bg-accent/30 shadow-md ring-1 ring-primary/20"
                      : "border-border/70 hover:border-primary/40 hover:bg-accent/20 hover:shadow-md hover:scale-[1.008]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenFaq(isOpen ? -1 : i);
                    }}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 text-left text-sm font-semibold cursor-pointer"
                  >
                    <span className={`transition-colors text-base ${isOpen ? "text-primary font-bold" : "text-foreground hover:text-primary"}`}>
                      {f.q}
                    </span>
                    {isOpen ? (
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs transition-transform duration-200">
                        <Minus className="size-4" aria-hidden />
                      </span>
                    ) : (
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary">
                        <Plus className="size-4" aria-hidden />
                      </span>
                    )}
                  </button>
                  {isOpen && (
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground border-t border-border/60 pt-3">
                      {f.a}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {/* ── Footer (With dynamic social links & Register box) ── */}
      <footer className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 lg:grid-cols-[1fr_auto_1fr] lg:items-center md:px-8">
          {/* Contact Details */}
          <div className="text-sm opacity-85 space-y-2">
            <p className="font-semibold text-base text-background">Contact Us</p>
            {(org?.phone_number || org?.contact_phone) && (
              <p className="flex items-center gap-2">
                <Phone className="size-4 opacity-70" aria-hidden />
                <a
                  href={`tel:${org?.phone_number || org?.contact_phone}`}
                  className="hover:underline"
                >
                  {org?.phone_number || org?.contact_phone}
                </a>
              </p>
            )}
            {(org?.contact_email || org?.support_email) && (
              <p className="flex items-center gap-2">
                <Mail className="size-4 opacity-70" aria-hidden />
                <a
                  href={`mailto:${org?.contact_email || org?.support_email}`}
                  className="hover:underline"
                >
                  {org?.contact_email || org?.support_email}
                </a>
              </p>
            )}
            <p className="text-xs opacity-70">
              {org?.full_address || org?.contact_address || org?.address || org?.location || "Online Learning Community"}
            </p>
          </div>

          {/* Center Callout Box: Register Form */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-background sm:text-3xl">
              Start Your Learning Journey Today!
            </h2>
            <p className="mt-2 text-sm opacity-80">
              Create an account now to explore courses, participate in events, and earn certificates.
            </p>
            <form onSubmit={handleRegisterSubmit} className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-full bg-background/10 p-2">
              <input
                type="email"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="Enter your email address"
                aria-label="Email Address"
                className="h-10 flex-1 rounded-full bg-transparent px-4 text-sm text-background outline-none placeholder:text-background/50"
              />
              <Button type="submit" className="rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
                Register
              </Button>
            </form>
          </div>

          {/* Social Media Links from Organization Settings */}
          <div className="text-sm opacity-85 lg:text-right space-y-3">
            <p className="font-semibold text-base text-background">Connect With Us</p>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              {(org?.twitter || org?.twitter_url) && (
                <a
                  href={org.twitter_url || org.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="grid size-9 place-items-center rounded-full bg-background/10 text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Twitter className="size-4" aria-hidden />
                </a>
              )}
              {(org?.facebook || org?.facebook_url) && (
                <a
                  href={org.facebook_url || org.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="grid size-9 place-items-center rounded-full bg-background/10 text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Facebook className="size-4" aria-hidden />
                </a>
              )}
              {(org?.linkedin || org?.linkedin_url) && (
                <a
                  href={org.linkedin_url || org.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="grid size-9 place-items-center rounded-full bg-background/10 text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Linkedin className="size-4" aria-hidden />
                </a>
              )}
              {(org?.instagram || org?.instagram_url) && (
                <a
                  href={org.instagram_url || org.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid size-9 place-items-center rounded-full bg-background/10 text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Instagram className="size-4" aria-hidden />
                </a>
              )}
              {(org?.website || org?.website_url) && (
                <a
                  href={org.website_url || org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Website"
                  className="grid size-9 place-items-center rounded-full bg-background/10 text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Globe className="size-4" aria-hidden />
                </a>
              )}
              {/* If no specific social link is filled yet, fallback to organization page */}
              {!org?.twitter && !org?.facebook && !org?.linkedin && !org?.instagram && !org?.website && (
                <Link
                  to="/organization"
                  className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-3.5 py-1.5 text-xs text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <BadgeCheck className="size-3.5" aria-hidden /> View Academy Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sub-footer / Copyright */}
        <div className="border-t border-background/15">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs opacity-70 md:px-8">
            <Link to="/organization" className="flex items-center gap-2 hover:opacity-100">
              <GraduationCap className="size-4 text-primary" aria-hidden /> {orgName}
            </Link>
            <span>© {new Date().getFullYear()} {orgName}. All Rights Reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/courses" className="hover:underline">Courses</Link>
              <Link to="/events" className="hover:underline">Events</Link>
              <Link to="/jobs" className="hover:underline">Jobs</Link>
              <Link to="/donations" className="hover:underline">Support Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
