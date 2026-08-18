import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, CircleHelp, Contact, Image as ImageIcon, Link2, Settings, Share2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getOrganizationSettings, updateOrganizationSettings } from "@/lib/organization-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/settings/organization")({
  head: () => ({
    meta: [
      { title: "Organization Settings | Lumina Learning" },
      {
        name: "description",
        content: "Manage your academy's brand identity, company info, contact details and public profile.",
      },
      { property: "og:title", content: "Organization Settings | Lumina Learning" },
      { property: "og:description", content: "Manage your academy's brand, contact details, and public profile." },
    ],
  }),
  component: () => (
    <AdminGuard>
      <OrgSettings />
    </AdminGuard>
  ),
});

function CardTitle({ icon: Icon, children }: { icon: typeof ImageIcon; children: string }) {
  return (
    <h2 className="flex items-center gap-2 border-b border-border pb-5 text-xl font-bold">
      <Icon className="size-5 text-primary" aria-hidden />
      {children}
    </h2>
  );
}

function OrgSettings() {
  const queryClient = useQueryClient();

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["org-settings"],
    queryFn: () => getOrganizationSettings(),
  });

  const [name, setName] = useState("Serene Academy");
  const [tagline, setTagline] = useState("Elevating Lifelong Learning");
  const [websiteUrl, setWebsiteUrl] = useState("https://sereneacademy.com");
  const [foundedYear, setFoundedYear] = useState("2024");
  const [location, setLocation] = useState("San Francisco, CA");
  const [description, setDescription] = useState("A premium platform dedicated to providing high-quality, distraction-free educational experiences for lifelong learners.");
  const [mission, setMission] = useState("To empower professionals through focused, calm, and high-end learning environments.");
  const [vision, setVision] = useState("To be the world's leading distraction-free learning network.");
  const [coreValues, setCoreValues] = useState("Excellence, Clarity, Integrity, Innovation");
  const [contactEmail, setContactEmail] = useState("hello@sereneacademy.com");
  const [contactPhone, setContactPhone] = useState("+1 (555) 123-4567");
  const [fullAddress, setFullAddress] = useState("1200 Serenity Way, Suite 400\nSan Francisco, CA 94105");
  const [twitter, setTwitter] = useState("https://twitter.com/sereneacademy");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("https://linkedin.com/company/sereneacademy");
  const [instagram, setInstagram] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (orgData) {
      if (orgData.name || orgData.organization_name) setName(orgData.name || orgData.organization_name || "");
      if (orgData.tagline || orgData.title) setTagline(orgData.tagline || orgData.title || "");
      if (orgData.website_url || orgData.website) setWebsiteUrl(orgData.website_url || orgData.website || "");
      if (orgData.founded_year) setFoundedYear(String(orgData.founded_year));
      if (orgData.location || orgData.base_location) setLocation(orgData.location || orgData.base_location || "");
      if (orgData.description || orgData.short_description) setDescription(orgData.description || orgData.short_description || "");
      if (orgData.mission || orgData.mission_statement) setMission(orgData.mission || orgData.mission_statement || "");
      if (orgData.vision || orgData.vision_statement) setVision(orgData.vision || orgData.vision_statement || "");
      if (orgData.core_values) setCoreValues(orgData.core_values);
      if (orgData.contact_email || orgData.support_email) setContactEmail(orgData.contact_email || orgData.support_email || "");
      if (orgData.contact_phone || orgData.phone_number) setContactPhone(orgData.contact_phone || orgData.phone_number || "");
      if (orgData.full_address || orgData.contact_address || orgData.address) setFullAddress(orgData.full_address || orgData.contact_address || orgData.address || "");
      if (orgData.twitter || orgData.twitter_url) setTwitter(orgData.twitter || orgData.twitter_url || "");
      if (orgData.facebook || orgData.facebook_url) setFacebook(orgData.facebook || orgData.facebook_url || "");
      if (orgData.linkedin || orgData.linkedin_url) setLinkedin(orgData.linkedin || orgData.linkedin_url || "");
      if (orgData.instagram || orgData.instagram_url) setInstagram(orgData.instagram || orgData.instagram_url || "");
      if (orgData.logo) setLogoPreview(getMediaUrl(orgData.logo));
    }
  }, [orgData]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Organization name is required");

      if (logoFile) {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("organization_name", name.trim());
        formData.append("tagline", tagline);
        formData.append("website_url", websiteUrl);
        formData.append("website", websiteUrl);
        formData.append("founded_year", foundedYear);
        formData.append("location", location);
        formData.append("description", description);
        formData.append("mission", mission);
        formData.append("vision", vision);
        formData.append("vision_statement", vision);
        formData.append("core_values", coreValues);
        formData.append("contact_email", contactEmail);
        formData.append("contact_phone", contactPhone);
        formData.append("full_address", fullAddress);
        formData.append("contact_address", fullAddress);
        formData.append("twitter", twitter);
        formData.append("twitter_url", twitter);
        formData.append("facebook", facebook);
        formData.append("facebook_url", facebook);
        formData.append("linkedin", linkedin);
        formData.append("linkedin_url", linkedin);
        formData.append("instagram", instagram);
        formData.append("instagram_url", instagram);
        formData.append("logo", logoFile);
        return await updateOrganizationSettings(formData);
      }

      return await updateOrganizationSettings({
        name: name.trim(),
        organization_name: name.trim(),
        tagline,
        website_url: websiteUrl,
        website: websiteUrl,
        founded_year: foundedYear,
        location,
        description,
        mission,
        vision,
        vision_statement: vision,
        core_values: coreValues,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        full_address: fullAddress,
        contact_address: fullAddress,
        twitter,
        twitter_url: twitter,
        facebook,
        facebook_url: facebook,
        linkedin,
        linkedin_url: linkedin,
        instagram,
        instagram_url: instagram,
      });
    },
    onSuccess: () => {
      toast.success("Organization settings saved successfully");
      void queryClient.invalidateQueries({ queryKey: ["org-settings"] });
    },
    onError: (err) => {
      toast.error(`Failed to save settings: ${getApiErrorMessage(err)}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <header className="border-b border-border/70">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5">
            <span className="font-display text-xl font-bold text-primary">Lumina Learning</span>
          </div>
        </header>
        <div className="mt-20 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Organization Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your academy's brand, contact details, and public profile.</p>

        <form
          className="mt-12 grid gap-6 lg:grid-cols-[1fr_400px]"
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
        >
          <div className="space-y-6">
            <section className="surface-card p-8">
              <CardTitle icon={ImageIcon}>Brand Identity</CardTitle>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="field-label">
                    Organization Name (Name) *
                  </Label>
                  <Input
                    id="org-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Serene Academy"
                    className="h-12 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline" className="field-label">
                    Title / Tagline
                  </Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Elevating Lifelong Learning"
                    className="h-12 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <p className="field-label">Organization Logo</p>
                <div className="flex items-center gap-6">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="size-24 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-lg border border-border bg-accent/50 text-xs text-muted-foreground">
                      Logo
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <span className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent">
                        Choose Logo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLogoFile(file);
                            setLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Recommended: 400x400px transparent PNG.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="surface-card p-8">
              <CardTitle icon={Building2}>Company Info</CardTitle>
              <div className="mt-6 grid gap-5 sm:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <div className="space-y-2">
                  <Label htmlFor="website" className="field-label">
                    Website URL
                  </Label>
                  <Input
                    id="website"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://sereneacademy.com"
                    className="h-12 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="founded" className="field-label">
                    Founded Year
                  </Label>
                  <Input
                    id="founded"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="2024"
                    className="h-12 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base" className="field-label">
                    Location
                  </Label>
                  <Input
                    id="base"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                    className="h-12 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="short" className="field-label">
                  Description
                </Label>
                <Textarea
                  id="short"
                  className="min-h-24 rounded-xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your organization…"
                />
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mission" className="field-label">
                    Mission
                  </Label>
                  <Textarea
                    id="mission"
                    className="min-h-20 rounded-xl"
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                    placeholder="Organization mission statement…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision" className="field-label">
                    Vision Statement
                  </Label>
                  <Textarea
                    id="vision"
                    className="min-h-20 rounded-xl"
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    placeholder="Organization vision statement…"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="core-values" className="field-label">
                  Core Values
                </Label>
                <Input
                  id="core-values"
                  value={coreValues}
                  onChange={(e) => setCoreValues(e.target.value)}
                  placeholder="e.g. Excellence, Integrity, Innovation"
                  className="h-12 rounded-lg"
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="surface-card p-8">
              <CardTitle icon={Contact}>Contact</CardTitle>
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="field-label">
                    Contact Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-12 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="field-label">
                    Contact Phone
                  </Label>
                  <Input
                    id="phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="h-12 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="field-label">
                    Full Address
                  </Label>
                  <Textarea
                    id="address"
                    className="min-h-24 rounded-xl"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="surface-card p-8">
              <CardTitle icon={Share2}>Social Links</CardTitle>
              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="twitter" className="text-xs text-muted-foreground">Twitter</Label>
                  <div className="relative">
                    <Link2
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="twitter"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="Twitter URL"
                      className="h-12 rounded-lg pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="facebook" className="text-xs text-muted-foreground">Facebook</Label>
                  <div className="relative">
                    <Link2
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="facebook"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="Facebook URL"
                      className="h-12 rounded-lg pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="linkedin" className="text-xs text-muted-foreground">LinkedIn</Label>
                  <div className="relative">
                    <Link2
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="linkedin"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="LinkedIn URL"
                      className="h-12 rounded-lg pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
                  <div className="relative">
                    <Link2
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Instagram URL"
                      className="h-12 rounded-lg pl-10"
                    />
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <div className="lg:col-span-2">
            <div className="flex justify-end gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg px-6"
                onClick={() => {
                  if (orgData) {
                    setName(orgData.name || orgData.organization_name || "Serene Academy");
                    setTagline(orgData.tagline || orgData.title || "Elevating Lifelong Learning");
                    setWebsiteUrl(orgData.website_url || orgData.website || "https://sereneacademy.com");
                    setFoundedYear(String(orgData.founded_year || "2024"));
                    setLocation(orgData.location || orgData.base_location || "San Francisco, CA");
                    setDescription(orgData.description || orgData.short_description || "");
                    setMission(orgData.mission || orgData.mission_statement || "");
                    setVision(orgData.vision || orgData.vision_statement || "");
                    setCoreValues(orgData.core_values || "");
                    setContactEmail(orgData.contact_email || orgData.support_email || "");
                    setContactPhone(orgData.contact_phone || orgData.phone_number || "");
                    setFullAddress(orgData.full_address || orgData.contact_address || orgData.address || "");
                    setTwitter(orgData.twitter || orgData.twitter_url || "");
                    setFacebook(orgData.facebook || orgData.facebook_url || "");
                    setLinkedin(orgData.linkedin || orgData.linkedin_url || "");
                    setInstagram(orgData.instagram || orgData.instagram_url || "");
                  }
                }}
              >
                Discard Changes
              </Button>
              <Button type="submit" disabled={saveMut.isPending} className="rounded-lg px-6">
                {saveMut.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
