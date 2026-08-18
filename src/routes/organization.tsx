import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Twitter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getOrganizationSettings } from "@/lib/organization-api";
import { getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/organization")({
  head: () => ({
    meta: [
      { title: "About Serene Academy | Lumina Learning" },
      {
        name: "description",
        content:
          "Serene Academy is a premium platform for high-quality, distraction-free learning. Read our mission, contact details and social links.",
      },
      { property: "og:title", content: "About Serene Academy" },
      { property: "og:description", content: "A premium platform for focused, distraction-free learning." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/organization" }],
  }),
  component: OrganizationPage,
});

function OrganizationPage() {
  const { data: org } = useQuery({
    queryKey: ["org-settings"],
    queryFn: () => getOrganizationSettings(),
  });

  const orgName = org?.name || org?.organization_name || "Serene Academy";
  const tagline = org?.tagline || org?.title || "Calm, focused learning for lifelong professionals.";
  const description =
    org?.description ||
    org?.short_description ||
    "A premium platform dedicated to providing high-quality, distraction-free educational experiences for lifelong learners.";
  const mission =
    org?.mission ||
    org?.mission_statement ||
    "To empower professionals through focused, calm, and high-end learning environments.";
  const vision = org?.vision || org?.vision_statement;
  const coreValues = org?.core_values;
  const founded = String(org?.founded_year || "2024");
  const location = org?.location || org?.base_location || "San Francisco, CA";
  const website = org?.website_url || org?.website || "sereneacademy.com";
  const email = org?.contact_email || org?.support_email || "hello@sereneacademy.com";
  const phone = org?.contact_phone || org?.phone_number || "+1 (555) 123-4567";
  const address = org?.full_address || org?.contact_address || org?.address || "1200 Serenity Way, Suite 400, San Francisco, CA 94105";

  const facts = [
    { label: "Founded", value: founded, icon: CalendarDays },
    { label: "Location", value: location, icon: MapPin },
    {
      label: "Website",
      value: website.replace(/^https?:\/\//, ""),
      icon: Globe,
      href: website.startsWith("http") ? website : `https://${website}`,
    },
  ];

  const contact = [
    { label: "Contact Email", value: email, icon: Mail, href: `mailto:${email}` },
    { label: "Contact Phone", value: phone, icon: Phone, href: `tel:${phone}` },
    { label: "Full Address", value: address, icon: MapPin },
  ];

  const socials = [
    { label: "Twitter", href: org?.twitter || org?.twitter_url || "https://twitter.com/sereneacademy", icon: Twitter },
    { label: "Facebook", href: org?.facebook || org?.facebook_url, icon: Facebook },
    { label: "LinkedIn", href: org?.linkedin || org?.linkedin_url || "https://linkedin.com/company/sereneacademy", icon: Linkedin },
    { label: "Instagram", href: org?.instagram || org?.instagram_url || "https://instagram.com/sereneacademy", icon: Instagram },
  ].filter((s) => Boolean(s.href));

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
        <section className="surface-card overflow-hidden p-0">
          <div className="h-36 bg-primary-soft" aria-hidden />
          <div className="px-8 pb-10">
            <div className="-mt-14 flex flex-wrap items-end gap-6">
              {org?.logo ? (
                <img
                  src={getMediaUrl(org.logo)}
                  alt={orgName}
                  className="size-28 shrink-0 rounded-3xl border border-border bg-card object-cover shadow-sm"
                />
              ) : (
                <span className="grid size-28 shrink-0 place-items-center rounded-3xl border border-border bg-card shadow-sm">
                  <Building2 className="size-12 text-primary" aria-hidden />
                </span>
              )}
              <div className="min-w-0 pb-1">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{orgName}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{tagline}</p>
              </div>
              <Button asChild className="ml-auto rounded-lg px-6">
                <Link to="/courses">Explore Courses</Link>
              </Button>
            </div>

            <p className="mt-8 max-w-3xl text-muted-foreground">{description}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl border border-border bg-card p-5">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <f.icon className="size-4 text-primary" aria-hidden /> {f.label}
                  </p>
                  {f.href ? (
                    <a
                      href={f.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {f.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-semibold">{f.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="surface-card space-y-6 p-8">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="size-5 text-primary" aria-hidden /> Mission
              </h2>
              <p className="mt-4 text-2xl font-semibold leading-relaxed">“{mission}”</p>
            </div>

            {vision && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-bold">Vision Statement</h3>
                <p className="mt-2 text-muted-foreground">{vision}</p>
              </div>
            )}

            {coreValues && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-bold">Core Values</h3>
                <p className="mt-2 text-muted-foreground">{coreValues}</p>
              </div>
            )}
          </div>

          <div className="surface-card p-8">
            <h2 className="text-xl font-bold">Contact</h2>
            <ul className="mt-6 space-y-5">
              {contact.map((c) => (
                <li key={c.label} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <c.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="break-words font-medium text-primary underline-offset-4 hover:underline">
                        {c.value}
                      </a>
                    ) : (
                      <p className="break-words font-medium">{c.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {socials.length > 0 && (
              <>
                <h3 className="mt-8 text-sm font-bold">Follow us</h3>
                <div className="mt-3 flex gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <s.icon className="size-4" aria-hidden />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
