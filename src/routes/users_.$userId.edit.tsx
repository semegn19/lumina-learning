import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Contact,
  Image as ImageIcon,
  Lock,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteUser, getUserById, updateUser } from "@/lib/users-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { getMediaUrl } from "@/lib/utils";
import type { AuthUser } from "@/lib/api-types";

export const Route = createFileRoute("/users_/$userId/edit")({
  head: () => ({
    meta: [
      { title: "Edit User Profile | Lumina Learning" },
      { name: "description", content: "Manage member profile details and contact information." },
      { property: "og:title", content: "Edit User Profile | Lumina Learning" },
      { property: "og:description", content: "Manage member profile details." },
    ],
  }),
  component: () => (
    <AdminGuard>
      <EditUserPage />
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

function EditUserPage() {
  const { userId } = useParams({ from: "/users_/$userId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading, isError } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.first_name || (currentUser.username ? currentUser.username : ""));
      setLastName(currentUser.last_name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone_number || currentUser.phone || currentUser.contact_phone || "");
      setLocation(currentUser.address || currentUser.location || currentUser.full_address || currentUser.contact_address || "");
      setBio(currentUser.bio || "");
      setExperience(currentUser.experience || "");

      if (Array.isArray(currentUser.skills)) {
        setSkills(currentUser.skills);
      } else if (typeof currentUser.skills === "string") {
        setSkills((currentUser.skills as string).split(",").map((s) => s.trim()).filter(Boolean));
      }

      const img = getMediaUrl(currentUser.profile_picture || currentUser.avatar);
      if (img) setAvatarPreview(img);
    }
  }, [currentUser]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);
        formData.append("phone_number", phone);
        formData.append("phone", phone);
        formData.append("address", location);
        formData.append("location", location);
        formData.append("bio", bio);
        formData.append("experience", experience);
        formData.append("skills", JSON.stringify(skills));
        formData.append("profile_picture", avatarFile);
        return await updateUser(userId, formData);
      }

      const payload: Partial<AuthUser> = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        phone,
        address: location,
        location,
        bio,
        experience,
        skills,
      };

      return await updateUser(userId, payload);
    },
    onSuccess: () => {
      toast.success("User profile updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["user", userId] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void navigate({ to: "/users/$userId", params: { userId } });
    },
    onError: (err) => {
      toast.error(`Failed to update user: ${getApiErrorMessage(err)}`);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: () => {
      toast.success("User deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void navigate({ to: "/users" });
    },
    onError: (err) => {
      toast.error(`Failed to delete user: ${getApiErrorMessage(err)}`);
    },
  });

  const addSkill = () => {
    const value = newSkill.trim();
    if (!value || skills.includes(value)) return;
    setSkills((s) => [...s, value]);
    setNewSkill("");
  };

  const displayName = `${firstName} ${lastName}`.trim() || email || `User #${userId}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-rose/40">
        <div className="mt-20 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isError || !currentUser) {
    return (
      <div className="min-h-screen bg-canvas-rose/40">
        <main className="mx-auto max-w-[1100px] px-6 pt-16 text-center">
          <h1 className="text-3xl font-bold">User Not Found</h1>
          <p className="mt-2 text-muted-foreground">The requested user profile could not be loaded.</p>
          <Button asChild className="mt-6 rounded-lg">
            <Link to="/users">Back to user management</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <Link
          to="/users/$userId"
          params={{ userId }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to user profile
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{displayName}</h1>
            <p className="mt-2 text-muted-foreground">
              Manage this member's profile details and contact information.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 rounded-lg text-destructive"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-4" aria-hidden /> Delete User
          </Button>
        </div>

        <form
          className="mt-10 grid gap-6 lg:grid-cols-[1fr_400px]"
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
        >
          <div className="space-y-6">
            <section className="surface-card p-8">
              <CardTitle icon={ImageIcon}>Profile Picture</CardTitle>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-6">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={displayName}
                      className="size-24 rounded-full border-2 border-border object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-full border-2 border-border bg-primary-soft text-xl font-bold text-primary shadow-sm">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <span className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent">
                        Choose Photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    <p className="mt-3 text-xs text-muted-foreground">
                      JPG, PNG, or WEBP up to 5 MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="field-label">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="field-label">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 rounded-lg"
                  />
                </div>
              </div>
            </section>

            <section className="surface-card p-8">
              <CardTitle icon={User}>Personal Details & Background</CardTitle>

              <div className="mt-6 space-y-2">
                <Label htmlFor="bio" className="field-label">
                  Bio / Overview
                </Label>
                <Textarea
                  id="bio"
                  rows={4}
                  className="min-h-24 rounded-xl"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short summary about the user…"
                />
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="skills" className="field-label">
                  Professional Skills
                </Label>
                <div className="flex flex-wrap gap-2 rounded-xl border border-input bg-card p-3">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                        aria-label={`Remove ${s}`}
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </span>
                  ))}
                  <div className="flex w-full items-center gap-2 pt-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Add skill e.g. React, Python…"
                      className="h-10 rounded-lg text-sm"
                    />
                    <Button type="button" variant="outline" className="h-10 rounded-lg px-4 text-xs" onClick={addSkill}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="experience" className="field-label">
                  Professional Background
                </Label>
                <Textarea
                  id="experience"
                  rows={4}
                  className="min-h-24 rounded-xl"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Work experience and history…"
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="surface-card p-8">
              <CardTitle icon={Contact}>Contact Info</CardTitle>
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="field-label">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="email"
                      value={email}
                      readOnly
                      className="h-12 rounded-lg bg-primary-soft/40 pl-10 text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="field-label">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="field-label">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-12 rounded-lg"
                  />
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
                onClick={() => void navigate({ to: "/users/$userId", params: { userId } })}
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

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure? This action can't be undone.</AlertDialogTitle>
            <AlertDialogDescription>
              {displayName} ({email}) will be permanently removed from the academy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteMut.mutate()}
            >
              {deleteMut.isPending ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
