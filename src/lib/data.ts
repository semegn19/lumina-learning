export type Role = "Master Admin" | "Secondary Admin" | "Student";

export type DirectoryUser = {     
  id: string;
  name: string;
  email: string;
  role: Role;
  active: string;
  added: string;
  img: number;
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  experience: string;
};

export const directoryUsers: DirectoryUser[] = [
  {
    id: "florence-shaw",
    name: "Florence Shaw",
    email: "florence@untitledui.com",
    role: "Master Admin",
    active: "Mar 4, 2024",
    added: "July 4, 2022",
    img: 5,
    phone: "+1 (555) 201-3311",
    location: "San Francisco, CA",
    bio: "Platform owner and product lead. Oversees curriculum quality across all Serene Academy programmes.",
    skills: ["Product Strategy", "Curriculum Design"],
    experience: "10 years leading education products, previously Head of Product at Northwind Learning.",
  },
  {
    id: "amelie-laurent",
    name: "Amélie Laurent",
    email: "amelie@untitledui.com",
    role: "Master Admin",
    active: "Mar 4, 2024",
    added: "July 4, 2022",
    img: 9,
    phone: "+33 6 12 44 90 21",
    location: "Paris, France",
    bio: "Design systems lead focused on accessible, calm learning interfaces.",
    skills: ["Design Systems", "Accessibility", "Figma"],
    experience: "8 years in product design, formerly Senior Designer at Atelier Studio.",
  },
  {
    id: "ammar-foley",
    name: "Ammar Foley",
    email: "ammar@untitledui.com",
    role: "Secondary Admin",
    active: "Mar 2, 2024",
    added: "July 4, 2022",
    img: 12,
    phone: "+1 (555) 884-1120",
    location: "Austin, TX",
    bio: "Manages course operations, publishing schedules and instructor onboarding.",
    skills: ["Operations", "Instructor Relations"],
    experience: "6 years in EdTech operations at scale.",
  },
  {
    id: "caitlyn-king",
    name: "Caitlyn King",
    email: "caitlyn@untitledui.com",
    role: "Secondary Admin",
    active: "Mar 6, 2024",
    added: "July 4, 2022",
    img: 16,
    phone: "+1 (555) 662-7781",
    location: "Chicago, IL",
    bio: "Community manager and events coordinator for live masterclasses.",
    skills: ["Community", "Event Planning"],
    experience: "5 years running large online learning communities.",
  },
  {
    id: "sienna-hewitt",
    name: "Sienna Hewitt",
    email: "sienna@untitledui.com",
    role: "Student",
    active: "Mar 8, 2024",
    added: "July 4, 2022",
    img: 21,
    phone: "+44 20 7946 1122",
    location: "London, UK",
    bio: "Career changer moving from marketing into product design.",
    skills: ["UI Design", "UX Research"],
    experience: "4 years in brand marketing, currently completing the UI Foundations track.",
  },
  {
    id: "olly-shroeder",
    name: "Olly Shroeder",
    email: "olly@untitledui.com",
    role: "Student",
    active: "Mar 6, 2024",
    added: "July 4, 2022",
    img: 33,
    phone: "+1 (555) 331-2094",
    location: "Denver, CO",
    bio: "Front-end developer expanding into interface design.",
    skills: ["React", "TypeScript", "Prototyping"],
    experience: "3 years building design-system driven web applications.",
  },
  {
    id: "mathilde-lewis",
    name: "Mathilde Lewis",
    email: "mathilde@untitledui.com",
    role: "Student",
    active: "Mar 4, 2024",
    added: "July 4, 2022",
    img: 47,
    phone: "+1 (555) 447-8890",
    location: "Toronto, ON",
    bio: "Freelance illustrator learning product design fundamentals.",
    skills: ["Illustration", "Visual Design"],
    experience: "7 years freelance illustration for editorial clients.",
  },
];

export const findUser = (id: string) => directoryUsers.find((u) => u.id === id);

export type ManagedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  deadline: string;
  status: "Open" | "Closed";
  applicants: number;
};

export const managedJobs: ManagedJob[] = [
  {
    id: "senior-ux-designer",
    title: "Senior UX/UI Designer",
    company: "Acme Corp",
    location: "San Francisco, CA",
    type: "Full-Time",
    salary: "$120k - $150k",
    posted: "Oct 2, 2024",
    deadline: "Oct 31, 2024",
    status: "Open",
    applicants: 4,
  },
  {
    id: "frontend-engineer",
    title: "Front-End Engineer",
    company: "Serene Academy",
    location: "Remote",
    type: "Full-Time",
    salary: "$100k - $135k",
    posted: "Sep 21, 2024",
    deadline: "Nov 5, 2024",
    status: "Open",
    applicants: 2,
  },
  {
    id: "curriculum-writer",
    title: "Curriculum Writer",
    company: "Serene Academy",
    location: "London, UK",
    type: "Contract",
    salary: "£300 / day",
    posted: "Aug 14, 2024",
    deadline: "Sep 30, 2024",
    status: "Closed",
    applicants: 1,
  },
];

export const findJob = (id: string) => managedJobs.find((j) => j.id === id);

export type Application = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  appliedAt: string;
  status: "Under Review" | "Submitted" | "Closed";
  coverLetter: string;
};

export const myApplications: Application[] = [
  {
    id: "app-1001",
    jobId: "senior-ux-designer",
    jobTitle: "Senior UX/UI Designer",
    company: "Acme Corp",
    location: "San Francisco, CA",
    appliedAt: "October 12, 2024",
    status: "Under Review",
    coverLetter:
      "I have spent the last five years designing calm, focused learning products and would love to bring that craft to Acme Corp. My portfolio includes three end-to-end design system rollouts.",
  },
  {
    id: "app-1002",
    jobId: "frontend-engineer",
    jobTitle: "Front-End Engineer",
    company: "Serene Academy",
    location: "Remote",
    appliedAt: "September 28, 2024",
    status: "Submitted",
    coverLetter:
      "React and TypeScript are my daily tools, and I care deeply about accessible interfaces. I would love to help build the next generation of the Serene platform.",
  },
  {
    id: "app-1003",
    jobId: "curriculum-writer",
    jobTitle: "Curriculum Writer",
    company: "Serene Academy",
    location: "London, UK",
    appliedAt: "August 30, 2024",
    status: "Closed",
    coverLetter:
      "I write long-form educational content and have authored two design curricula used by over 4,000 learners.",
  },
];

export const findApplication = (id: string) => myApplications.find((a) => a.id === id);

export type Applicant = {
  userId: string;
  jobId: string;
  appliedAt: string;
  coverLetter: string;
};

export const jobApplicants: Applicant[] = [
  {
    userId: "sienna-hewitt",
    jobId: "senior-ux-designer",
    appliedAt: "October 12, 2024",
    coverLetter:
      "After four years in brand marketing I moved fully into product design, and the Senior UX/UI role is exactly the kind of end-to-end ownership I am looking for. I have shipped two full redesigns this year.",
  },
  {
    userId: "olly-shroeder",
    jobId: "senior-ux-designer",
    appliedAt: "October 10, 2024",
    coverLetter:
      "I bridge design and engineering — I build the components I design. I would bring a strong systems mindset to your design system maintenance work.",
  },
  {
    userId: "mathilde-lewis",
    jobId: "senior-ux-designer",
    appliedAt: "October 8, 2024",
    coverLetter:
      "My illustration background gives me a distinctive visual voice, and I have spent the last year formalising that into product interface work.",
  },
  {
    userId: "caitlyn-king",
    jobId: "senior-ux-designer",
    appliedAt: "October 5, 2024",
    coverLetter:
      "I have partnered with design teams for five years running research sessions and would love to move into a design-led role.",
  },
  {
    userId: "olly-shroeder",
    jobId: "frontend-engineer",
    appliedAt: "September 29, 2024",
    coverLetter: "Three years of React and TypeScript with a strong focus on accessible, design-system driven UIs.",
  },
  {
    userId: "sienna-hewitt",
    jobId: "frontend-engineer",
    appliedAt: "September 27, 2024",
    coverLetter: "I am comfortable in the front-end stack and obsessive about interface detail.",
  },
  {
    userId: "mathilde-lewis",
    jobId: "curriculum-writer",
    appliedAt: "August 30, 2024",
    coverLetter: "I have authored two design curricula and write clearly for beginner audiences.",
  },
];

export type Discount = {
  id: string;
  title: string;
  description: string;
  code: string;
  end_date: string;
  percentage: number;
};

export const discountList: Discount[] = [
  {
    id: "winter-pass",
    title: "Winter Pass",
    description: "Full access to every course in the catalogue for the winter season.",
    code: "WINTER40",
    end_date: "2024-12-31",
    percentage: 40,
  },
  {
    id: "ui-foundations",
    title: "UI Foundations Launch",
    description: "Launch pricing on Mastering UI Design Foundations.",
    code: "UIFOUND25",
    end_date: "2024-11-15",
    percentage: 25,
  },
  {
    id: "alumni-return",
    title: "Alumni Return",
    description: "A thank-you discount for learners who have already completed a course.",
    code: "ALUMNI15",
    end_date: "2025-03-01",
    percentage: 15,
  },
];

export const findDiscount = (id: string) => discountList.find((d) => d.id === id);
